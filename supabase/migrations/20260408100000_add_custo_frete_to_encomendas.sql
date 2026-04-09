-- Add custo_frete field to encomendas (cost paid to Carol for SP-MRS shipping)
-- valor_frete = sale price to client (4.95 EUR/kg)
-- custo_frete = cost paid to Carol (4.65 EUR/kg)
ALTER TABLE encomendas ADD COLUMN IF NOT EXISTS custo_frete NUMERIC DEFAULT 0;

-- Migrate existing orders: calculate custo_frete from peso_total where valor_frete exists
UPDATE encomendas
SET custo_frete = ROUND(peso_total * 4.65, 2)
WHERE peso_total > 0 AND (custo_frete IS NULL OR custo_frete = 0);

-- Update valor_frete to use 4.95 rate for orders that still use old 4.5 rate
-- Only for orders not yet delivered (in progress)
UPDATE encomendas
SET valor_frete = ROUND(peso_total * 4.95, 2)
WHERE peso_total > 0
  AND status NOT IN ('ENTREGUE')
  AND valor_frete = ROUND(peso_total * 4.5, 2);

-- Remove frete items from itens_encomenda for non-delivered orders
-- First delete any custos_producao linked to frete items
DELETE FROM custos_producao_encomenda
WHERE item_encomenda_id IN (
  SELECT ie.id FROM itens_encomenda ie
  JOIN encomendas e ON e.id = ie.encomenda_id
  WHERE ie.produto_id = '00000000-0000-0000-0000-000000000001'
  AND e.status NOT IN ('ENTREGUE')
);

DELETE FROM itens_encomenda
WHERE produto_id = '00000000-0000-0000-0000-000000000001'
AND encomenda_id IN (
  SELECT id FROM encomendas WHERE status NOT IN ('ENTREGUE')
);

-- Deactivate the frete product (keep for historical reference)
UPDATE produtos
SET ativo = false, deactivated_at = NOW(), deactivated_reason = 'Migrated to native frete fields in encomendas'
WHERE id = '00000000-0000-0000-0000-000000000001';
