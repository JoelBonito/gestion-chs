-- Fix the salvar_edicao_encomenda function to properly handle order editing
-- Remove the old 2-parameter version and keep only the 3-parameter version

DROP FUNCTION IF EXISTS public.salvar_edicao_encomenda(jsonb, jsonb);

-- Update the 3-parameter function to be more robust
CREATE OR REPLACE FUNCTION public.salvar_edicao_encomenda(
  p_encomenda_id uuid, 
  p_dados jsonb, 
  p_itens jsonb
)
RETURNS TABLE(id uuid, valor_total numeric, valor_total_custo numeric, valor_pago_fornecedor numeric, saldo_devedor_fornecedor numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_len int;
  v_ids_enviados int;
  v_user_role text;
  v_user_email text;
BEGIN
  -- Get user email and role
  SELECT auth.email() INTO v_user_email;
  
  -- Security: only the owner can edit OR users with admin/ops role OR specific admin emails
  SELECT e.created_by INTO v_owner
  FROM public.encomendas e
  WHERE e.id = p_encomenda_id;

  IF v_owner IS NULL THEN
    RAISE exception 'ENCOMENDA_NAO_ENCONTRADA' USING errcode = 'P0002';
  END IF;

  -- Check current user role
  SELECT ur.role::text INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  -- Allow editing if owner OR admin/ops OR specific admin emails
  IF v_owner <> auth.uid() 
     AND (v_user_role IS NULL OR v_user_role NOT IN ('admin', 'ops'))
     AND v_user_email NOT IN ('jbento1@gmail.com', 'admin@admin.com') THEN
    RAISE exception 'FORBIDDEN' USING errcode = '42501';
  END IF;

  -- Update basic data (only if key exists in JSON)
  UPDATE public.encomendas e
  SET
    numero_encomenda = CASE WHEN p_dados ? 'numero_encomenda'
                            THEN p_dados->>'numero_encomenda' ELSE e.numero_encomenda END,
    cliente_id       = CASE WHEN p_dados ? 'cliente_id'
                            THEN (p_dados->>'cliente_id')::uuid ELSE e.cliente_id END,
    fornecedor_id    = CASE WHEN p_dados ? 'fornecedor_id'
                            THEN (p_dados->>'fornecedor_id')::uuid ELSE e.fornecedor_id END,
    data_envio_estimada     = CASE WHEN p_dados ? 'data_envio_estimada'
                                   THEN (p_dados->>'data_envio_estimada')::date ELSE e.data_envio_estimada END,
    data_producao_estimada  = CASE WHEN p_dados ? 'data_producao_estimada'
                                   THEN (p_dados->>'data_producao_estimada')::date ELSE e.data_producao_estimada END,
    observacoes      = CASE WHEN p_dados ? 'observacoes'
                            THEN p_dados->>'observacoes' ELSE e.observacoes END,
    valor_frete      = CASE WHEN p_dados ? 'valor_frete'
                            THEN nullif(p_dados->>'valor_frete','')::numeric ELSE e.valor_frete END,
    updated_at       = now()
  WHERE e.id = p_encomenda_id;

  -- Clear existing items first for clean replacement
  DELETE FROM public.itens_encomenda
  WHERE encomenda_id = p_encomenda_id;

  -- Insert all new items
  WITH dados_itens AS (
    SELECT
      (itm->>'produto_id')::uuid              AS produto_id,
      coalesce((itm->>'quantidade')::numeric, 0)     AS quantidade,
      coalesce((itm->>'preco_unitario')::numeric, 0) AS preco_unitario,
      coalesce((itm->>'preco_custo')::numeric, 0)    AS preco_custo
    FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) AS itm
    WHERE (itm->>'produto_id') IS NOT NULL
  )
  INSERT INTO public.itens_encomenda (encomenda_id, produto_id, quantidade, preco_unitario, preco_custo)
  SELECT 
    p_encomenda_id, 
    dados_itens.produto_id, 
    dados_itens.quantidade, 
    dados_itens.preco_unitario,
    dados_itens.preco_custo
  FROM dados_itens;

  -- Recalculate sales and cost
  PERFORM public.recalc_valor_total_venda_encomenda(p_encomenda_id);
  PERFORM public.recalc_valor_total_custo_encomenda(p_encomenda_id);

  -- Update supplier balance
  UPDATE public.encomendas e
  SET saldo_devedor_fornecedor = coalesce(e.valor_total_custo,0) - coalesce(e.valor_pago_fornecedor,0)
  WHERE e.id = p_encomenda_id;

  -- Return result
  RETURN QUERY
    SELECT e.id, e.valor_total, e.valor_total_custo, e.valor_pago_fornecedor, e.saldo_devedor_fornecedor
    FROM public.encomendas e
    WHERE e.id = p_encomenda_id;
END;
$function$;