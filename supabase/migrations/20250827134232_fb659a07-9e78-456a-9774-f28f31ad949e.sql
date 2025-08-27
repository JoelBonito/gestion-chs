-- Limpar todos os dados das tabelas, mantendo a estrutura
-- Ordem importa devido às chaves estrangeiras

-- Primeiro, tabelas que dependem de outras
DELETE FROM public.pagamentos;
DELETE FROM public.pagamentos_fornecedor;
DELETE FROM public.itens_encomenda;
DELETE FROM public.frete_encomenda;
DELETE FROM public.invoices;
DELETE FROM public.attachments;
DELETE FROM public.activity_log;

-- Depois, as tabelas principais
DELETE FROM public.encomendas;
DELETE FROM public.produtos;
DELETE FROM public.clientes;
DELETE FROM public.fornecedores;

-- Reset sequences (se existirem)
-- Nota: UUID não precisam de reset, mas outros campos com sequências sim