-- Create new enum with all values including MATÉRIA PRIMA and EMBALAGENS
CREATE TYPE status_encomenda_new AS ENUM (
  'NOVO PEDIDO',
  'MATÉRIA PRIMA', 
  'PRODUÇÃO',
  'EMBALAGEM',
  'EMBALAGENS',
  'TRANSPORTE',
  'ENTREGUE'
);

-- Add a temporary column with the new enum type
ALTER TABLE encomendas ADD COLUMN status_new status_encomenda_new;

-- Update the temporary column based on the current status, migrating EMBALAGEM to EMBALAGENS
UPDATE encomendas SET status_new = 
  CASE 
    WHEN status::text = 'EMBALAGEM' THEN 'EMBALAGENS'::status_encomenda_new
    ELSE status::text::status_encomenda_new
  END;

-- Make the new column NOT NULL
ALTER TABLE encomendas ALTER COLUMN status_new SET NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE encomendas DROP COLUMN status;
ALTER TABLE encomendas RENAME COLUMN status_new TO status;

-- Set default value for new status column
ALTER TABLE encomendas ALTER COLUMN status SET DEFAULT 'NOVO PEDIDO'::status_encomenda_new;

-- Drop the old enum and rename the new one
DROP TYPE status_encomenda;
ALTER TYPE status_encomenda_new RENAME TO status_encomenda;