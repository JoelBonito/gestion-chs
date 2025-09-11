-- First update any inconsistent entity_type values
UPDATE public.attachments 
SET entity_type = 'projeto' 
WHERE entity_type = 'invoice';

-- Drop existing entity_type CHECK constraint and recreate including all entity types
ALTER TABLE public.attachments
  DROP CONSTRAINT IF EXISTS attachments_entity_type_check;

ALTER TABLE public.attachments
  ADD CONSTRAINT attachments_entity_type_check
  CHECK (entity_type IN (
    'receivable',
    'payable',
    'financeiro',
    'pagamento',
    'projeto',
    'encomenda',
    'produto'
  ));

-- Create helpful index to speed up lookups by entity
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_attachments_entity' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_attachments_entity ON public.attachments (entity_type, entity_id);
  END IF;
END $$;