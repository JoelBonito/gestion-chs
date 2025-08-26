
-- First, let's check if we have freight data and add some sample data if needed
-- Insert sample freight data for existing orders
INSERT INTO frete_encomenda (encomenda_id, valor_frete, peso_total, descricao)
SELECT 
  e.id,
  292.50 as valor_frete,
  5.0 as peso_total,
  'FRETE SÃO PAULO - MARSELHA' as descricao
FROM encomendas e
WHERE NOT EXISTS (
  SELECT 1 FROM frete_encomenda f WHERE f.encomenda_id = e.id
)
LIMIT 5;

-- Update some sample cost data for existing orders
UPDATE encomendas 
SET valor_total_custo = valor_total * 0.6
WHERE valor_total_custo = 0 OR valor_total_custo IS NULL;

-- Update frete field in encomendas table to match frete_encomenda
UPDATE encomendas e
SET valor_frete = (
  SELECT f.valor_frete 
  FROM frete_encomenda f 
  WHERE f.encomenda_id = e.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM frete_encomenda f WHERE f.encomenda_id = e.id
);
