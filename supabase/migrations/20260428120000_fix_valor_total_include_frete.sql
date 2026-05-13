-- Migration: Fix valor_total to always include valor_frete
-- Created: 2026-04-28
-- Description: The function atualizar_valor_total_encomenda() was recalculating
--              valor_total from itens_encomenda only, losing the valor_frete.
--              This fixes it to always include valor_frete in valor_total.
--              Note: saldo_devedor and saldo_devedor_fornecedor are GENERATED columns,
--              so they auto-update when valor_total/valor_pago or valor_total_custo/valor_pago_fornecedor change.

-- 1. Fix the function that recalculates valor_total when items change
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_encomenda()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encomenda_id UUID;
BEGIN
  -- Determine which encomenda_id to update
  IF TG_OP = 'DELETE' THEN
    v_encomenda_id := OLD.encomenda_id;
  ELSE
    v_encomenda_id := NEW.encomenda_id;
  END IF;

  -- Recalcular o valor_total da encomenda (itens + frete)
  UPDATE public.encomendas 
  SET valor_total = COALESCE((
    SELECT SUM(subtotal) 
    FROM public.itens_encomenda 
    WHERE encomenda_id = v_encomenda_id
  ), 0) + COALESCE(valor_frete, 0)
  WHERE id = v_encomenda_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 2. Also fix the function that recalculates valor_total_custo to include custo_frete
-- (this ensures supplier balance also includes freight cost)
CREATE OR REPLACE FUNCTION public.recalc_valor_total_custo_encomenda(p_encomenda UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.encomendas
  SET valor_total_custo = COALESCE((
    SELECT SUM(quantidade * preco_custo)
    FROM public.itens_encomenda
    WHERE encomenda_id = p_encomenda
  ), 0) + COALESCE(custo_frete, 0)
  WHERE id = p_encomenda;
END;
$$;

-- 3. Backfill: recalculate valor_total for all orders to include valor_frete
-- This will auto-update saldo_devedor (GENERATED column) via the trigger calcular_saldo_cliente
UPDATE public.encomendas e
SET valor_total = COALESCE((
  SELECT SUM(i.subtotal)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = e.id
), 0) + COALESCE(e.valor_frete, 0);

-- 4. Backfill: recalculate valor_total_custo for all orders to include custo_frete
-- This will auto-update saldo_devedor_fornecedor (GENERATED column)
UPDATE public.encomendas e
SET valor_total_custo = COALESCE((
  SELECT SUM(i.quantidade * i.preco_custo)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = e.id
), 0) + COALESCE(e.custo_frete, 0);
