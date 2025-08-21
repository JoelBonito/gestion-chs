
-- Adicionar o campo size_weight na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN size_weight numeric DEFAULT 0 NOT NULL;

-- Atualizar todos os produtos existentes para ter size_weight = 0
UPDATE public.produtos 
SET size_weight = 0 
WHERE size_weight IS NULL;
