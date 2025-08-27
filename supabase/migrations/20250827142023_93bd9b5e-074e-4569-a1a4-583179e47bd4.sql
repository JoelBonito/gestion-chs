-- Migration to clean all existing data from main tables
-- Deleting in order to respect foreign key constraints

-- Delete items first (depends on encomendas and produtos)
DELETE FROM public.itens_encomenda;

-- Delete payments (depends on encomendas)
DELETE FROM public.pagamentos;
DELETE FROM public.pagamentos_fornecedor;

-- Delete freight data (depends on encomendas)
DELETE FROM public.frete_encomenda;

-- Delete orders (depends on clientes and fornecedores)
DELETE FROM public.encomendas;

-- Delete products (depends on fornecedores)
DELETE FROM public.produtos;

-- Delete clients
DELETE FROM public.clientes;

-- Delete suppliers
DELETE FROM public.fornecedores;

-- Delete activity logs for a clean slate
DELETE FROM public.activity_log;

-- Delete attachments
DELETE FROM public.attachments;

-- Delete invoices
DELETE FROM public.invoices;

-- Reset sequences if they exist (optional)
-- This ensures that new IDs will start from 1 again
-- Note: UUIDs don't use sequences, but keeping this for completeness