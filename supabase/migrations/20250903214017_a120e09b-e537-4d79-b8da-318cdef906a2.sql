-- Corrija o nome da função se o seu for diferente
CREATE OR REPLACE FUNCTION public.salvar_edicao_encomenda(
  p_encomenda jsonb,
  p_itens jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encomenda_id uuid;
  v_item jsonb;
BEGIN
  -- pega o id da encomenda do JSON
  v_encomenda_id := (p_encomenda->>'id')::uuid;

  -- Atualiza a encomenda (QUALIFICANDO a tabela com alias e.)
  UPDATE public.encomendas AS e
     SET numero_encomenda        = coalesce(p_encomenda->>'numero_encomenda', e.numero_encomenda),
         cliente_id              = coalesce((p_encomenda->>'cliente_id')::uuid, e.cliente_id),
         fornecedor_id           = coalesce((p_encomenda->>'fornecedor_id')::uuid, e.fornecedor_id),
         data_producao_estimada  = (p_encomenda->>'data_producao_estimada')::date,
         data_envio_estimada     = (p_encomenda->>'data_envio_estimada')::date
   WHERE e.id = v_encomenda_id;

  -- Upsert dos itens (QUALIFICANDO sempre i.id, i.encomenda_id, etc.)
  FOR v_item IN
    SELECT * FROM jsonb_array_elements(coalesce(p_itens, '[]'::jsonb))
  LOOP
    IF (v_item ? 'id') AND (v_item->>'id') IS NOT NULL THEN
      -- UPDATE de item existente
      UPDATE public.itens_encomenda AS i
         SET produto_id     = coalesce((v_item->>'produto_id')::uuid, i.produto_id),
             quantidade     = coalesce((v_item->>'quantidade')::numeric, i.quantidade),
             preco_unitario = coalesce((v_item->>'preco_unitario')::numeric, i.preco_unitario),
             preco_custo    = coalesce((v_item->>'preco_custo')::numeric, i.preco_custo)
       WHERE i.id = (v_item->>'id')::uuid
         AND i.encomenda_id = v_encomenda_id;
    ELSE
      -- INSERT de novo item
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

  -- (Opcional) Remover itens que não vieram no payload:
  -- DELETE FROM public.itens_encomenda i
  -- WHERE i.encomenda_id = v_encomenda_id
  --   AND i.id NOT IN (
  --     SELECT (elem->>'id')::uuid
  --     FROM jsonb_array_elements(p_itens) elem
  --     WHERE elem ? 'id' AND (elem->>'id') IS NOT NULL
  --   );

  RETURN;
END;
$$;