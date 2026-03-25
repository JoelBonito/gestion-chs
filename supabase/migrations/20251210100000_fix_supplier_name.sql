-- Migration: Fix inconsistent supplier names for Onl'us Beauty
-- Date: 2025-12-10
-- Author: Assistant (Antigravity)
-- Description: Unifies 'fornecedor_nome' in 'encomendas' table for supplier ID b8f995d2...

-- Update records with old name 'Fabrica São José do Rio Preto' or NULL or variants
UPDATE encomendas
SET fornecedor_nome = 'Onl''us Beauty'
WHERE fornecedor_id = 'b8f995d2-47dc-4c8f-9779-ce21431f5244';
