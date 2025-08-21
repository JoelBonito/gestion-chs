
-- Limpar todas as tabelas principais do sistema
-- Ordem importante devido às foreign keys

-- 1. Primeiro limpar tabelas que dependem de encomendas
DELETE FROM pagamentos_fornecedor;
DELETE FROM pagamentos;
DELETE FROM frete_encomenda;
DELETE FROM itens_encomenda;

-- 2. Depois limpar encomendas
DELETE FROM encomendas;

-- 3. Limpar produtos (que podem ter foreign key para fornecedores)
DELETE FROM produtos;

-- 4. Limpar clientes e fornecedores
DELETE FROM clientes;
DELETE FROM fornecedores;

-- 5. Limpar logs de atividade (opcional, mas recomendado para começar limpo)
DELETE FROM activity_log;

-- Reiniciar sequências se existirem (para IDs começarem do 1 novamente)
-- Como usamos UUIDs, não é necessário, mas fica aqui para referência
