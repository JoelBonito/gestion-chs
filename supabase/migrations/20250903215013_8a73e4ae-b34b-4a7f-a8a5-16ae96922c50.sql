-- Atualizar função RPC para retornar dados e recalcular valores
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
  v_encomenda_id   uuid := (p_encomenda->>'id')::uuid;
  v_numero         text := p_encomenda->>'numero_encomenda';
  v_cliente_id     uuid := (p_encomenda->>'cliente_id')::uuid;
  v_fornecedor_id  uuid := (p_encomenda->>'fornecedor_id')::uuid;
  v_data_prod      date := (p_encomenda->>'data_producao_estimada')::date;
  v_data_envio     date := (p_encomenda->>'data_envio_estimada')::date;
  v_observacoes    text := p_encomenda->>'observacoes';

  v_item           jsonb;
  v_item_id        uuid;
  v_len            int;
  v_ids_enviados   int;
BEGIN
  -- Verificar se encomenda existe e permissões
  IF NOT EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = v_encomenda_id 
    AND (e.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = ANY(ARRAY['admin'::user_role, 'ops'::user_role])
    ))
  ) THEN
    RAISE EXCEPTION 'Encomenda não encontrada ou sem permissão' USING ERRCODE = 'P0002';
  END IF;

  -- Atualizar a encomenda
  UPDATE public.encomendas AS e
     SET numero_encomenda       = coalesce(v_numero, e.numero_encomenda),
         cliente_id             = coalesce(v_cliente_id, e.cliente_id),
         fornecedor_id          = coalesce(v_fornecedor_id, e.fornecedor_id),
         data_producao_estimada = v_data_prod,
         data_envio_estimada    = v_data_envio,
         observacoes            = v_observacoes,
         updated_at             = now()
   WHERE e.id = v_encomenda_id;

  -- UPSERT dos itens
  WITH dados_itens AS (
    SELECT
      nullif(itm->>'id','')::uuid             AS item_id,
      (itm->>'produto_id')::uuid              AS produto_id,
      coalesce((itm->>'quantidade')::numeric, 0)     AS quantidade,
      coalesce((itm->>'preco_unitario')::numeric, 0) AS preco_unitario,
      coalesce((itm->>'preco_custo')::numeric, 0)    AS preco_custo
    FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) AS itm
  )
  INSERT INTO public.itens_encomenda (id, encomenda_id, produto_id, quantidade, preco_unitario, preco_custo)
  SELECT 
    coalesce(dados_itens.item_id, gen_random_uuid()), 
    v_encomenda_id, 
    dados_itens.produto_id, 
    dados_itens.quantidade, 
    dados_itens.preco_unitario,
    dados_itens.preco_custo
  FROM dados_itens
  ON CONFLICT (id) DO UPDATE
    SET produto_id    = EXCLUDED.produto_id,
        quantidade    = EXCLUDED.quantidade,
        preco_unitario= EXCLUDED.preco_unitario,
        preco_custo   = EXCLUDED.preco_custo;

  -- Remover itens que não vieram no payload
  SELECT jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) INTO v_len;
  SELECT count(*) INTO v_ids_enviados
  FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) AS itm
  WHERE nullif(itm->>'id','') IS NOT NULL;

  IF v_len = 0 THEN
    -- Se não enviou itens, remove todos
    DELETE FROM public.itens_encomenda
    WHERE encomenda_id = v_encomenda_id;
  ELSIF v_ids_enviados > 0 THEN
    -- Se enviou itens com ID, remove os que não estão na lista
    DELETE FROM public.itens_encomenda i
    WHERE i.encomenda_id = v_encomenda_id
      AND i.id NOT IN (
        SELECT nullif(itm->>'id','')::uuid
        FROM jsonb_array_elements(p_itens) AS itm
        WHERE nullif(itm->>'id','') IS NOT NULL
      );
  END IF;

  -- Recalcular valores totais
  PERFORM public.recalc_valor_total_venda_encomenda(v_encomenda_id);
  PERFORM public.recalc_valor_total_custo_encomenda(v_encomenda_id);

  -- Atualizar saldo devedor do fornecedor
  UPDATE public.encomendas e
  SET saldo_devedor_fornecedor = coalesce(e.valor_total_custo,0) - coalesce(e.valor_pago_fornecedor,0)
  WHERE e.id = v_encomenda_id;

  -- Retornar dados atualizados
  RETURN QUERY
    SELECT e.id, e.valor_total, e.valor_total_custo, e.valor_pago_fornecedor, e.saldo_devedor_fornecedor
    FROM public.encomendas e
    WHERE e.id = v_encomenda_id;
END;
$$;