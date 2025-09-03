-- Ajuste o nome se o seu for diferente (mantive 'salvar_edicao_encomenda')
CREATE OR REPLACE FUNCTION public.salvar_edicao_encomenda(
  p_encomenda jsonb,
  p_itens     jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- NÃO use 'id' como nome de variável
  v_encomenda_id   uuid := (p_encomenda->>'id')::uuid;
  v_numero         text := p_encomenda->>'numero_encomenda';
  v_cliente_id     uuid := (p_encomenda->>'cliente_id')::uuid;
  v_fornecedor_id  uuid := (p_encomenda->>'fornecedor_id')::uuid;
  v_data_prod      date := (p_encomenda->>'data_producao_estimada')::date;
  v_data_envio     date := (p_encomenda->>'data_envio_estimada')::date;

  v_item           jsonb;
  v_item_id        uuid;
BEGIN
  -- Atualiza a encomenda (colunas QUALIFICADAS com alias 'e')
  UPDATE public.encomendas AS e
     SET numero_encomenda       = coalesce(v_numero, e.numero_encomenda),
         cliente_id             = coalesce(v_cliente_id, e.cliente_id),
         fornecedor_id          = coalesce(v_fornecedor_id, e.fornecedor_id),
         data_producao_estimada = coalesce(v_data_prod, e.data_producao_estimada),
         data_envio_estimada    = coalesce(v_data_envio, e.data_envio_estimada)
   WHERE e.id = v_encomenda_id;

  -- Itera itens do payload
  FOR v_item IN
    SELECT * FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb))
  LOOP
    v_item_id := null;
    IF (v_item ? 'id') AND (v_item->>'id') IS NOT NULL THEN
      v_item_id := (v_item->>'id')::uuid;
    END IF;

    IF v_item_id IS NOT NULL THEN
      -- UPDATE do item existente (QUALIFICAR alias 'i')
      UPDATE public.itens_encomenda AS i
         SET produto_id     = coalesce((v_item->>'produto_id')::uuid,    i.produto_id),
             quantidade     = coalesce((v_item->>'quantidade')::numeric, i.quantidade),
             preco_unitario = coalesce((v_item->>'preco_unitario')::numeric, i.preco_unitario),
             preco_custo    = coalesce((v_item->>'preco_custo')::numeric,    i.preco_custo)
       WHERE i.id = v_item_id
         AND i.encomenda_id = v_encomenda_id;
    ELSE
      -- INSERT de item novo
      INSERT INTO public.itens_encomenda
        (encomenda_id, produto_id, quantidade, preco_unitario, preco_custo)
      VALUES
        (
          v_encomenda_id,
          (v_item->>'produto_id')::uuid,
          coalesce((v_item->>'quantidade')::numeric, 0),
          coalesce((v_item->>'preco_unitario')::numeric, 0),
          coalesce((v_item->>'preco_custo')::numeric, 0)
        );
    END IF;
  END LOOP;

  -- (Opcional) Remover itens não enviados no payload:
  -- DELETE FROM public.itens_encomenda AS i
  -- WHERE i.encomenda_id = v_encomenda_id
  --   AND NOT EXISTS (
  --     SELECT 1
  --     FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) j
  --     WHERE (j->>'id')::uuid = i.id
  --   );

  RETURN;
END;
$$;