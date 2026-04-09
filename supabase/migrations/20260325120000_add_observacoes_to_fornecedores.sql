-- Migration: Add observacoes column to fornecedores table
-- Created: 2024-12-25
-- Description: Adds a text field for storing internal notes about suppliers

-- Add the observacoes column
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN fornecedores.observacoes IS 'Internal notes and observations about the supplier';
