-- Migration: Link supplier payments to the exact order item paid
-- Created: 2026-04-29
-- Description:
--   Adds item_encomenda_id to pagamentos_fornecedor so grouped/partial payments
--   can still be reconciled against the precise payable line.

ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS item_encomenda_id UUID REFERENCES public.itens_encomenda(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.pagamentos_fornecedor.item_encomenda_id
  IS 'Exact order item paid. Used with item_tipo to reconcile grouped and partial supplier payments by payable line.';

CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedor_item_encomenda_id
  ON public.pagamentos_fornecedor(item_encomenda_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedor_item_encomenda_tipo
  ON public.pagamentos_fornecedor(item_encomenda_id, item_tipo);
