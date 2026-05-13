-- Migration: Add fornecedor OKLAN (Carol) to fornecedores table
-- Created: 2026-04-28
-- Description: Creates the "OKLAN" supplier representing Carol for packaging and tax costs.

INSERT INTO public.fornecedores (nome, email, telefone, endereco, contato, observacoes, active, created_by)
SELECT 
  'OKLAN',
  NULL,
  NULL,
  NULL,
  'Carol',
  'Fornecedora padrão para custos de embalagem e imposto (manuseamento Carol)',
  TRUE,
  '00000000-0000-0000-0000-000000000000'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.fornecedores WHERE nome = 'OKLAN'
);
