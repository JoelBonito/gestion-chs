-- Recriar função completamente sem ambiguidades
DROP FUNCTION IF EXISTS public.salvar_edicao_encomenda(jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.salvar_edicao_encomenda(
  p_encomenda jsonb,
  p_itens     jsonb
)
RETURNS TABLE(
  id uuid, 
  valor_total numeric, 
  valor_total_custo numeric, 
  valor_pago_fornecedor numeric, 
  saldo_devedor_fornecedor numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encomenda_id   uuid;
  v_numero         text;
  v_cliente_id     uuid;
  v_fornecedor_id  uuid;
  v_data_prod      date;
  v_data_envio     date;
  v_observacoes    text;
  v_item           jsonb;
  v_item_uuid      uuid;
  v_produto_uuid   uuid;
  v_quantidade     numeric;
  v_preco_unit     numeric;
  v_preco_cost     numeric;
BEGIN
  -- Extrair dados do JSON
  v_encomenda_id := (p_encomenda->>'id')::uuid;
  v_numero := p_encomenda->>'numero_encomenda';
  v_cliente_id := (p_encomenda->>'cliente_id')::uuid;
  v_fornecedor_id := (p_encomenda->>'fornecedor_id')::uuid;
  v_data_prod := (p_encomenda->>'data_producao_estimada')::date;
  v_data_envio := (p_encomenda->>'data_envio_estimada')::date;
  v_observacoes := p_encomenda->>'observacoes';

  -- Verificar permissões
  IF NOT EXISTS (
    SELECT 1 FROM public.encomendas enc 
    WHERE enc.id = v_encomenda_id 
    AND (enc.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::user_role, 'ops'::user_role])
    ))
  ) THEN
    RAISE EXCEPTION 'Encomenda não encontrada ou sem permissão' USING ERRCODE = 'P0002';
  END IF;

  -- Atualizar encomenda
  UPDATE public.encomendas 
     SET numero_encomenda       = coalesce(v_numero, numero_encomenda),
         cliente_id             = coalesce(v_cliente_id, cliente_id),
         fornecedor_id          = coalesce(v_fornecedor_id, fornecedor_id),
         data_producao_estimada = v_data_prod,
         data_envio_estimada    = v_data_envio,
         observacoes            = v_observacoes,
         updated_at             = now()
   WHERE id = v_encomenda_id;

  -- Primeiro, remover todos os itens existentes
  DELETE FROM public.itens_encomenda WHERE encomenda_id = v_encomenda_id;

  -- Inserir todos os itens novamente
  FOR v_item IN
    SELECT * FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb))
  LOOP
    v_produto_uuid := (v_item->>'produto_id')::uuid;
    v_quantidade := coalesce((v_item->>'quantidade')::numeric, 0);
    v_preco_unit := coalesce((v_item->>'preco_unitario')::numeric, 0);
    v_preco_cost := coalesce((v_item->>'preco_custo')::numeric, 0);

    INSERT INTO public.itens_encomenda 
      (encomenda_id, produto_id, quantidade, preco_unitario, preco_custo)
    VALUES 
      (v_encomenda_id, v_produto_uuid, v_quantidade, v_preco_unit, v_preco_cost);
  END LOOP;

  -- Recalcular valores totais
  PERFORM public.recalc_valor_total_venda_encomenda(v_encomenda_id);
  PERFORM public.recalc_valor_total_custo_encomenda(v_encomenda_id);

  -- Atualizar saldo devedor do fornecedor
  UPDATE public.encomendas 
  SET saldo_devedor_fornecedor = coalesce(valor_total_custo,0) - coalesce(valor_pago_fornecedor,0)
  WHERE id = v_encomenda_id;

  -- Retornar dados atualizados
  RETURN QUERY
    SELECT enc.id, enc.valor_total, enc.valor_total_custo, enc.valor_pago_fornecedor, enc.saldo_devedor_fornecedor
    FROM public.encomendas enc
    WHERE enc.id = v_encomenda_id;
END;
$$;