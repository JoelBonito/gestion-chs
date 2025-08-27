-- Add missing columns to encomendas table for snapshots and ensure created_by is populated

-- Add snapshot columns if they don't exist
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS cliente_nome text,
ADD COLUMN IF NOT EXISTS fornecedor_nome text;

-- Ensure created_by is populated for any existing records that might be missing it
-- This is a safety measure for any old data
UPDATE public.encomendas 
SET created_by = (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::user_role 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Create index for better performance on created_by queries
CREATE INDEX IF NOT EXISTS idx_encomendas_created_by ON public.encomendas(created_by);