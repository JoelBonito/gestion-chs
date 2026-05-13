-- Migration: Trigger to recalculate valor_total when frete fields change on encomendas
-- Created: 2026-04-28
-- Description: When frete_ativo, valor_frete, or custo_frete change on the encomendas table,
--              valor_total and valor_total_custo must be recalculated.

CREATE OR REPLACE FUNCTION public.recalcular_total_encomenda_por_frete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalculate valor_total (items + freight if active)
  NEW.valor_total := COALESCE((
    SELECT SUM(subtotal)
    FROM public.itens_encomenda
    WHERE encomenda_id = NEW.id
  ), 0) + CASE
    WHEN NEW.frete_ativo THEN COALESCE(NEW.valor_frete, 0)
    ELSE 0
  END;

  -- Recalculate valor_total_custo (items cost + freight cost if active)
  NEW.valor_total_custo := COALESCE((
    SELECT SUM(quantidade * preco_custo)
    FROM public.itens_encomenda
    WHERE encomenda_id = NEW.id
  ), 0) + CASE
    WHEN NEW.frete_ativo THEN COALESCE(NEW.custo_frete, 0)
    ELSE 0
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalcular_total_por_frete ON public.encomendas;

CREATE TRIGGER trigger_recalcular_total_por_frete
  BEFORE UPDATE OF frete_ativo, valor_frete, custo_frete ON public.encomendas
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_total_encomenda_por_frete();
