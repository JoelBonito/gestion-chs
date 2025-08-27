-- Limpar todos os dados do sistema para publicação do SaaS
-- A ordem é importante devido às foreign keys

-- Desabilitar triggers temporariamente para evitar recálculos
ALTER TABLE public.encomendas DISABLE TRIGGER ALL;

-- Limpar dados dependentes primeiro
DELETE FROM public.activity_log;
DELETE FROM public.attachments;
DELETE FROM public.pagamentos;
DELETE FROM public.pagamentos_fornecedor;
DELETE FROM public.frete_encomenda;
DELETE FROM public.itens_encomenda;
DELETE FROM public.invoices;

-- Limpar tabelas principais
DELETE FROM public.encomendas;
DELETE FROM public.produtos;
DELETE FROM public.clientes;
DELETE FROM public.fornecedores;

-- Reabilitar triggers
ALTER TABLE public.encomendas ENABLE TRIGGER ALL;

-- Limpar storage bucket (anexos)
DELETE FROM storage.objects WHERE bucket_id = 'attachments';