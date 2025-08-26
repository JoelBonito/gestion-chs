
-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_status ON encomendas(status);
CREATE INDEX IF NOT EXISTS idx_encomendas_cliente ON encomendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_encomenda_encomenda ON itens_encomenda(encomenda_id);
