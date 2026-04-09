-- Migration: Add observacoes column to clientes table
-- Created: 2024-12-25
-- Description: Adds a text field for storing internal notes about clients

-- Add the observacoes column
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN clientes.observacoes IS 'Internal notes and observations about the client';
