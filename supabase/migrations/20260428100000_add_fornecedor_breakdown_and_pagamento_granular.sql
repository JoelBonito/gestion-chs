-- Migration: Fornecedores por Item de Producao + Pagamento Granular
-- Created: 2026-04-28
-- Description: 
--   1. Adds fornecedor_breakdown JSONB to produtos (persist supplier per cost item)
--   2. Adds fornecedor_breakdown JSONB to custos_producao_encomenda (snapshot)
--   3. Adds fornecedor_id, moeda, item_tipo to pagamentos_fornecedor (payment tracking)

-- ============================================================================
-- 1. PRODUTOS: Add fornecedor_breakdown JSONB
-- ============================================================================
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS fornecedor_breakdown JSONB;

COMMENT ON COLUMN public.produtos.fornecedor_breakdown
  IS 'JSON map of cost item → supplier UUID. Keys: garrafa, tampa, rotulo, producao_nonato, frete_sp, embalagem_carol, imposto, diversos. Values: fornecedores.id. Used to pre-fill suppliers on future orders.';

-- ============================================================================
-- 2. CUSTOS_PRODUCAO_ENCOMENDA: Add fornecedor_breakdown JSONB (snapshot)
-- ============================================================================
ALTER TABLE public.custos_producao_encomenda
  ADD COLUMN IF NOT EXISTS fornecedor_breakdown JSONB;

COMMENT ON COLUMN public.custos_producao_encomenda.fornecedor_breakdown
  IS 'Snapshot of supplier assignments used for this specific order item. Copied from produtos.fornecedor_breakdown at the time of saving, can be overridden per order.';

-- ============================================================================
-- 3. PAGAMENTOS_FORNECEDOR: Add fornecedor_id, moeda, item_tipo
-- ============================================================================

-- Foreign key to the actual supplier who received the payment
ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.pagamentos_fornecedor.fornecedor_id
  IS 'Actual supplier who received this payment. May differ from the suggested supplier in custos_producao_encomenda.';

-- Currency of the payment (BRL for production items, EUR for international freight)
ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'EUR';

COMMENT ON COLUMN public.pagamentos_fornecedor.moeda
  IS 'Currency of payment: BRL (Brazilian Real) for production cost items, EUR (Euro) for international freight.';

-- Type of cost item being paid (granular tracking)
ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS item_tipo TEXT;

COMMENT ON COLUMN public.pagamentos_fornecedor.item_tipo
  IS 'Cost item type: garrafa, tampa, rotulo, producao, frete_sp, embalagem, imposto, diversos, frete_internacional. Enables annual reports by item and by supplier.';

-- Add check constraint for valid moeda values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pagamentos_fornecedor_moeda'
  ) THEN
    ALTER TABLE public.pagamentos_fornecedor
      ADD CONSTRAINT chk_pagamentos_fornecedor_moeda
      CHECK (moeda IN ('BRL', 'EUR'));
  END IF;
END $$;

-- Add check constraint for valid item_tipo values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pagamentos_fornecedor_item_tipo'
  ) THEN
    ALTER TABLE public.pagamentos_fornecedor
      ADD CONSTRAINT chk_pagamentos_fornecedor_item_tipo
      CHECK (item_tipo IN ('garrafa', 'tampa', 'rotulo', 'producao', 'frete_sp', 'embalagem', 'imposto', 'diversos', 'frete_internacional'));
  END IF;
END $$;

-- ============================================================================
-- 4. INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedor_fornecedor_id
  ON public.pagamentos_fornecedor(fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedor_item_tipo
  ON public.pagamentos_fornecedor(item_tipo);

CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedor_moeda
  ON public.pagamentos_fornecedor(moeda);
