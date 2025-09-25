-- Create new enum with updated values including MATÉRIA PRIMA and EMBALAGENS instead of EMBALAGEM
CREATE TYPE status_encomenda_new AS ENUM (
  'NOVO PEDIDO',
  'MATÉRIA PRIMA', 
  'PRODUÇÃO',
  'EMBALAGENS',
  'TRANSPORTE',
  'ENTREGUE'
);

-- Remove the default temporarily
ALTER TABLE encomendas ALTER COLUMN status DROP DEFAULT;

-- Update existing 'EMBALAGEM' values to 'EMBALAGENS'
UPDATE encomendas 
SET status = 'EMBALAGENS'::text::status_encomenda 
WHERE status = 'EMBALAGEM'::status_encomenda;

-- Change column type with proper mapping
ALTER TABLE encomendas 
ALTER COLUMN status TYPE status_encomenda_new 
USING (
  CASE status::text
    WHEN 'EMBALAGEM' THEN 'EMBALAGENS'::status_encomenda_new
    ELSE status::text::status_encomenda_new
  END
);

-- Set new default
ALTER TABLE encomendas ALTER COLUMN status SET DEFAULT 'NOVO PEDIDO'::status_encomenda_new;

-- Drop old enum and rename new one
DROP TYPE status_encomenda;
ALTER TYPE status_encomenda_new RENAME TO status_encomenda;