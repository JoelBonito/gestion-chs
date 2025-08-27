
-- Desabilitar verificações de chave estrangeira temporariamente para facilitar a limpeza
SET session_replication_role = replica;

-- Limpar dados financeiros primeiro (dependências)
DELETE FROM public.pagamentos;
DELETE FROM public.pagamentos_fornecedor;
DELETE FROM public.invoices;

-- Limpar itens de encomenda e frete
DELETE FROM public.itens_encomenda;
DELETE FROM public.frete_encomenda;

-- Limpar encomendas
DELETE FROM public.encomendas;

-- Limpar produtos
DELETE FROM public.produtos;

-- Limpar clientes
DELETE FROM public.clientes;

-- Limpar fornecedores
DELETE FROM public.fornecedores;

-- Limpar anexos
DELETE FROM public.attachments;

-- Limpar logs de atividade
DELETE FROM public.activity_log;

-- Reabilitar verificações de chave estrangeira
SET session_replication_role = DEFAULT;
