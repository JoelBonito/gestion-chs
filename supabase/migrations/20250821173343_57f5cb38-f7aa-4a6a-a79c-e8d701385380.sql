-- Adicionar coluna 'ativo' na tabela produtos para implementar soft delete
ALTER TABLE public.produtos 
ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para melhorar performance das consultas por produtos ativos
CREATE INDEX idx_produtos_ativo ON public.produtos(ativo);

-- Comentário para documentar a funcionalidade
COMMENT ON COLUMN public.produtos.ativo IS 'Campo para soft delete - true = produto visível, false = produto inativo';