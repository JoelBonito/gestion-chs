
-- Adicionar nova coluna para peso em gramas
ALTER TABLE produtos ADD COLUMN peso_gramas INTEGER;

-- Alterar o tipo da coluna tamanho para aceitar apenas números (ml)
ALTER TABLE produtos ALTER COLUMN tamanho TYPE INTEGER USING NULL;

-- Renomear a coluna para ser mais clara
ALTER TABLE produtos RENAME COLUMN tamanho TO tamanho_ml;

-- Limpar todos os registros de produtos existentes para permitir novo cadastro
DELETE FROM produtos;

-- Adicionar constraint para garantir que tamanho_ml e peso_gramas sejam positivos
ALTER TABLE produtos ADD CONSTRAINT check_tamanho_ml_positive CHECK (tamanho_ml > 0);
ALTER TABLE produtos ADD CONSTRAINT check_peso_gramas_positive CHECK (peso_gramas > 0);

-- Tornar as colunas obrigatórias
ALTER TABLE produtos ALTER COLUMN tamanho_ml SET NOT NULL;
ALTER TABLE produtos ALTER COLUMN peso_gramas SET NOT NULL;
