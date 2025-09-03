-- Fix the ambiguous column reference in salvar_edicao_encomenda function
CREATE OR REPLACE FUNCTION public.salvar_edicao_encomenda(
  p_encomenda_id uuid,
  p_dados jsonb,
  p_itens jsonb
)
RETURNS TABLE(
  id uuid,
  valor_total numeric,
  valor_total_custo numeric,
  valor_pago_fornecedor numeric,
  saldo_devedor_fornecedor numeric
) AS $$
DECLARE
  item jsonb;
  total_custo numeric := 0;
  total_venda numeric := 0;
BEGIN
  -- Update the encomenda with new data
  UPDATE public.encomendas SET
    numero_encomenda = COALESCE((p_dados->>'numero_encomenda')::text, numero_encomenda),
    cliente_id = COALESCE((p_dados->>'cliente_id')::uuid, cliente_id),
    fornecedor_id = COALESCE((p_dados->>'fornecedor_id')::uuid, fornecedor_id),
    data_producao_estimada = COALESCE((p_dados->>'data_producao_estimada')::date, data_producao_estimada),
    data_envio_estimada = COALESCE((p_dados->>'data_envio_estimada')::date, data_envio_estimada),
    observacoes = COALESCE((p_dados->>'observacoes')::text, observacoes),
    updated_at = now()
  WHERE encomendas.id = p_encomenda_id;

  -- Delete existing items for this encomenda
  DELETE FROM public.itens_encomenda WHERE encomenda_id = p_encomenda_id;

  -- Insert new items and calculate totals
  FOR item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO public.itens_encomenda (
      encomenda_id,
      produto_id,
      quantidade,
      preco_unitario,
      preco_custo,
      subtotal
    ) VALUES (
      p_encomenda_id,
      (item->>'produto_id')::uuid,
      (item->>'quantidade')::integer,
      (item->>'preco_unitario')::numeric,
      COALESCE((
        SELECT p.preco_custo 
        FROM public.produtos p 
        WHERE p.id = (item->>'produto_id')::uuid
      ), 0),
      (item->>'quantidade')::integer * (item->>'preco_unitario')::numeric
    );
    
    -- Add to totals
    total_venda := total_venda + ((item->>'quantidade')::integer * (item->>'preco_unitario')::numeric);
    total_custo := total_custo + ((item->>'quantidade')::integer * COALESCE((
      SELECT p.preco_custo 
      FROM public.produtos p 
      WHERE p.id = (item->>'produto_id')::uuid
    ), 0));
  END LOOP;

  -- Update encomenda totals
  UPDATE public.encomendas SET
    valor_total = total_venda,
    valor_total_custo = total_custo,
    saldo_devedor_fornecedor = total_custo - COALESCE(valor_pago_fornecedor, 0),
    updated_at = now()
  WHERE encomendas.id = p_encomenda_id;

  -- Return updated encomenda data
  RETURN QUERY
  SELECT 
    e.id,
    e.valor_total,
    e.valor_total_custo,
    e.valor_pago_fornecedor,
    e.saldo_devedor_fornecedor
  FROM public.encomendas e
  WHERE e.id = p_encomenda_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;