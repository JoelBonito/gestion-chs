-- Corrigir a função recalc_valor_total_custo_encomenda para incluir o frete
-- Problema: A função atual não soma o valor do frete ao valor_total_custo
-- Isso causa o desaparecimento de encomendas da aba de Compras quando o frete é adicionado

CREATE OR REPLACE FUNCTION public.recalc_valor_total_custo_encomenda(p_encomenda uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.encomendas e
  SET valor_total_custo = COALESCE((
    -- Soma dos custos dos itens
    SELECT SUM(i.quantidade * i.preco_custo)
    FROM public.itens_encomenda i
    WHERE i.encomenda_id = p_encomenda
  ), 0) + COALESCE((
    -- Soma do valor do frete
    SELECT SUM(f.valor_frete)
    FROM public.frete_encomenda f
    WHERE f.encomenda_id = p_encomenda
  ), 0)
  WHERE e.id = p_encomenda;

  -- Recalcular o saldo devedor do fornecedor
  UPDATE public.encomendas
  SET saldo_devedor_fornecedor = COALESCE(valor_total_custo, 0) - COALESCE(valor_pago_fornecedor, 0)
  WHERE id = p_encomenda;
END;
$function$;

-- Backfill: Recalcular todas as encomendas para incluir o frete no valor_total_custo
DO $$
DECLARE
  encomenda_record RECORD;
BEGIN
  FOR encomenda_record IN
    SELECT DISTINCT e.id
    FROM public.encomendas e
    INNER JOIN public.frete_encomenda f ON f.encomenda_id = e.id
  LOOP
    PERFORM public.recalc_valor_total_custo_encomenda(encomenda_record.id);
  END LOOP;

  RAISE NOTICE 'Recálculo de valor_total_custo concluído para todas as encomendas com frete.';
END $$;
