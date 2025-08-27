-- Migration for Soft Delete Implementation with Multi-Tenant Support
-- Part 1: Add columns to all tables

-- Add missing columns to clientes table
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
ADD COLUMN IF NOT EXISTS deactivated_reason text,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to produtos table  
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
ADD COLUMN IF NOT EXISTS deactivated_reason text,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add missing columns to fornecedores table (created_by already exists, active doesn't)
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
ADD COLUMN IF NOT EXISTS deactivated_reason text;

-- Add missing columns to encomendas table
ALTER TABLE public.encomendas
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill created_by columns with first available auth user
DO $$
DECLARE
    first_user_id uuid;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, we'll skip backfill (will be handled when first user signs up)
    IF first_user_id IS NOT NULL THEN
        -- Backfill clientes
        UPDATE public.clientes 
        SET created_by = first_user_id 
        WHERE created_by IS NULL;
        
        -- Backfill produtos  
        UPDATE public.produtos
        SET created_by = first_user_id
        WHERE created_by IS NULL;
        
        -- Backfill fornecedores (if created_by is NULL)
        UPDATE public.fornecedores
        SET created_by = first_user_id
        WHERE created_by IS NULL;
        
        -- Backfill encomendas
        UPDATE public.encomendas
        SET created_by = first_user_id
        WHERE created_by IS NULL;
    END IF;
END $$;

-- Set NOT NULL constraints after backfill
ALTER TABLE public.clientes ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.produtos ALTER COLUMN created_by SET NOT NULL;  
ALTER TABLE public.fornecedores ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE public.encomendas ALTER COLUMN created_by SET NOT NULL;

-- Set default values for created_by
ALTER TABLE public.clientes ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE public.produtos ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE public.fornecedores ALTER COLUMN created_by SET DEFAULT auth.uid();
ALTER TABLE public.encomendas ALTER COLUMN created_by SET DEFAULT auth.uid();