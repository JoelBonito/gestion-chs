-- Atualizar constraint para incluir novos tipos de entidade
ALTER TABLE public.attachments DROP CONSTRAINT attachments_entity_type_check;

ALTER TABLE public.attachments ADD CONSTRAINT attachments_entity_type_check 
CHECK (entity_type = ANY (ARRAY['produto'::text, 'financeiro'::text, 'pagamento'::text, 'receivable'::text, 'payable'::text, 'invoice'::text]));