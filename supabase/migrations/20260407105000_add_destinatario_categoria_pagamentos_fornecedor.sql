-- Migration: Add destinatario and categoria columns to pagamentos_fornecedor
-- Created: 2026-04-07
-- Description: Tracks payment recipient and cost category for the Compras financial tab.
--              Both columns are nullable to preserve backwards compatibility with existing rows.

-- Add destinatario column (who is being paid)
ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS destinatario TEXT;

COMMENT ON COLUMN public.pagamentos_fornecedor.destinatario
  IS 'Payment recipient name (supplier, subcontractor, etc.)';

-- Add categoria column (cost category)
ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS categoria TEXT;

COMMENT ON COLUMN public.pagamentos_fornecedor.categoria
  IS 'Cost category for this payment (e.g. materia-prima, transporte, embalagem)';
