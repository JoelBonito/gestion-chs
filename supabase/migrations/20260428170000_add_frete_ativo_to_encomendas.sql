-- Migration: Add frete_ativo flag to distinguish charged vs. indicative freight
-- Created: 2026-04-28
-- Description: The frontend already distinguishes "active freight" (charged to client)
--              from "indicative freight" (reference only, button shows "Adicionar Frete").
--              However, this state was never persisted to the database.
--              Migration 20260428120000 incorrectly included valor_frete in valor_total
--              for ALL orders, even those where freight was only indicative.
--              This migration:
--              1. Adds frete_ativo column
--              2. Modifies triggers to only include freight when frete_ativo = TRUE
--              3. Backfills frete_ativo using payment history heuristics
--              4. Recalculates valor_total and valor_total_custo respecting the flag
--              5. Restores valor_pago to real values from pagamentos table

-- =============================================================================
-- 1. ADD frete_ativo COLUMN
-- =============================================================================
ALTER TABLE public.encomendas
ADD COLUMN IF NOT EXISTS frete_ativo BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- 2. DETERMINE frete_ativo FOR EXISTING ORDERS (heuristic based on payments)
-- =============================================================================
-- Logic:
--   - valor_total currently includes valor_frete (due to migration 20260428120000)
--   - valor_total - valor_frete = items only
--   - If valor_pago >= valor_total: client paid everything INCLUDING freight → frete_ativo = TRUE
--   - If valor_pago >= (valor_total - valor_frete) but < valor_total:
--       client paid items only, NOT freight → frete_ativo = FALSE
--   - Otherwise (partial payment, less than items): ambiguous → default TRUE
--
-- Step 2a: Orders where client clearly paid including freight
UPDATE public.encomendas
SET frete_ativo = TRUE
WHERE valor_frete > 0
  AND valor_pago >= valor_total - 0.01;

-- Step 2b: Orders where client paid items only (not freight)
UPDATE public.encomendas
SET frete_ativo = FALSE
WHERE valor_frete > 0
  AND valor_pago >= (valor_total - valor_frete - 0.01)
  AND valor_pago < valor_total - 0.01;

-- Step 2c: Remaining orders with freight (ambiguous or no payments) → default TRUE
--          (This preserves previous behavior where freight was always charged)
UPDATE public.encomendas
SET frete_ativo = TRUE
WHERE valor_frete > 0
  AND frete_ativo IS FALSE
  AND valor_pago < (valor_total - valor_frete - 0.01);

-- =============================================================================
-- 3. FIX TRIGGER: atualizar_valor_total_encomenda
-- =============================================================================
-- Only include valor_frete in valor_total when frete_ativo = TRUE
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_encomenda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encomenda_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_encomenda_id := OLD.encomenda_id;
  ELSE
    v_encomenda_id := NEW.encomenda_id;
  END IF;

  UPDATE public.encomendas
  SET valor_total = COALESCE((
    SELECT SUM(subtotal)
    FROM public.itens_encomenda
    WHERE encomenda_id = v_encomenda_id
  ), 0) + CASE
    WHEN frete_ativo THEN COALESCE(valor_frete, 0)
    ELSE 0
  END
  WHERE id = v_encomenda_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =============================================================================
-- 4. FIX FUNCTION: recalc_valor_total_custo_encomenda
-- =============================================================================
-- Only include custo_frete in valor_total_custo when frete_ativo = TRUE
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
  ), 0) + CASE
    WHEN frete_ativo THEN COALESCE(custo_frete, 0)
    ELSE 0
  END
  WHERE id = p_encomenda;
END;
$$;

-- =============================================================================
-- 5. BACKFILL: Recalculate valor_total respecting frete_ativo
-- =============================================================================
UPDATE public.encomendas e
SET valor_total = COALESCE((
  SELECT SUM(i.subtotal)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = e.id
), 0) + CASE
  WHEN e.frete_ativo THEN COALESCE(e.valor_frete, 0)
  ELSE 0
END;

-- =============================================================================
-- 6. BACKFILL: Recalculate valor_total_custo respecting frete_ativo
-- =============================================================================
UPDATE public.encomendas e
SET valor_total_custo = COALESCE((
  SELECT SUM(i.quantidade * i.preco_custo)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = e.id
), 0) + CASE
  WHEN e.frete_ativo THEN COALESCE(e.custo_frete, 0)
  ELSE 0
END;

-- =============================================================================
-- 7. RESTORE valor_pago FROM REAL PAYMENT RECORDS
-- =============================================================================
-- Migration 20260428150000 artificially inflated valor_pago for some "paid" orders.
-- We restore the real values from the pagamentos table.
ALTER TABLE public.pagamentos DISABLE TRIGGER trigger_atualizar_valor_pago_encomenda;

UPDATE public.encomendas e
SET valor_pago = COALESCE((
  SELECT SUM(p.valor_pagamento)
  FROM public.pagamentos p
  WHERE p.encomenda_id = e.id
), 0);

UPDATE public.encomendas e
SET valor_pago_fornecedor = COALESCE((
  SELECT SUM(pf.valor_pagamento)
  FROM public.pagamentos_fornecedor pf
  WHERE pf.encomenda_id = e.id
), 0);

ALTER TABLE public.pagamentos ENABLE TRIGGER trigger_atualizar_valor_pago_encomenda;

-- =============================================================================
-- 8. FORCE SALDO RECALCULATION
-- =============================================================================
-- saldo_devedor is GENERATED: valor_total - valor_pago
-- saldo_devedor_fornecedor is maintained by trigger calcular_saldo_fornecedor()
UPDATE public.encomendas
SET updated_at = NOW()
WHERE id IN (
  SELECT id FROM public.encomendas
  WHERE COALESCE(valor_total, 0) - COALESCE(valor_pago, 0) != COALESCE(saldo_devedor, 0)
     OR COALESCE(valor_total_custo, 0) - COALESCE(valor_pago_fornecedor, 0) != COALESCE(saldo_devedor_fornecedor, 0)
);
