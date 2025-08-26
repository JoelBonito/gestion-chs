
-- Eliminar todos os dados das tabelas, mantendo a estrutura
DELETE FROM public.frete_encomenda;
DELETE FROM public.itens_encomenda;
DELETE FROM public.pagamentos;
DELETE FROM public.pagamentos_fornecedor;
DELETE FROM public.attachments;
DELETE FROM public.activity_log;
DELETE FROM public.encomendas;
DELETE FROM public.produtos;
DELETE FROM public.clientes;
DELETE FROM public.fornecedores;
DELETE FROM public.user_roles;

-- Reset sequences if any exist
-- Note: Since we're using gen_random_uuid(), there are no sequences to reset
