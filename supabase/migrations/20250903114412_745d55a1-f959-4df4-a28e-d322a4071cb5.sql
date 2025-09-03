-- Recalcular o valor total de custo para a encomenda ENC-2025-250
UPDATE public.encomendas 
SET valor_total_custo = coalesce((
  SELECT sum(i.quantidade * i.preco_custo)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = encomendas.id
), 0),
saldo_devedor_fornecedor = coalesce((
  SELECT sum(i.quantidade * i.preco_custo)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = encomendas.id
), 0) - valor_pago_fornecedor
WHERE numero_encomenda = 'ENC-2025-250';