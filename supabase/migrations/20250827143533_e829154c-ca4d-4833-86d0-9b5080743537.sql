-- Add unique constraint for numero_encomenda per user
-- This ensures each user can have unique order numbers within their own data

-- First, remove any existing global unique constraint on numero_encomenda if it exists
ALTER TABLE public.encomendas 
DROP CONSTRAINT IF EXISTS encomendas_numero_encomenda_key;

-- Add composite unique constraint for numero_encomenda per user
ALTER TABLE public.encomendas 
ADD CONSTRAINT encomendas_numero_encomenda_user_unique 
UNIQUE (created_by, numero_encomenda);

-- Create index for better performance on numero_encomenda queries
CREATE INDEX IF NOT EXISTS idx_encomendas_numero_user 
ON public.encomendas(created_by, numero_encomenda);