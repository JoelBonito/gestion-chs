-- Migration: Add fornecedor NOVIC (Nonato) to fornecedores table
-- Created: 2026-04-28
-- Description: Creates the "NOVIC" supplier representing Nonato for production costs.
--              This allows selecting Nonato as a supplier in the production cost management.

-- Insert NOVIC (Nonato) as an active supplier (only if not exists)
INSERT INTO public.fornecedores (nome, email, telefone, endereco, contato, observacoes, active, created_by)
SELECT 
  'NOVIC',
  NULL,
  NULL,
  NULL,
  'Nonato',
  'Fornecedor padrão para custos de produção (mão de obra Nonato)',
  TRUE,
  '00000000-0000-0000-0000-000000000000'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.fornecedores WHERE nome = 'NOVIC'
);
