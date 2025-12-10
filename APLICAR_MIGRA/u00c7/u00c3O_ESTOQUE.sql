-- INSTRUÇÕES: Aplique esta migração no SQL Editor do dashboard do Supabase
-- Dashboard: https://supabase.com/dashboard/project/uxlxxcwsgfwocvfqdykf/sql

-- Adicionar colunas de estoque na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS estoque_garrafas INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_tampas INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_rotulos INTEGER NOT NULL DEFAULT 0;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.produtos.estoque_garrafas IS 'Quantidade de garrafas/potes em estoque';
COMMENT ON COLUMN public.produtos.estoque_tampas IS 'Quantidade de tampas em estoque';
COMMENT ON COLUMN public.produtos.estoque_rotulos IS 'Quantidade de rótulos em estoque';

-- Criar índice para melhor performance ao filtrar por estoque baixo
CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo 
ON public.produtos(estoque_garrafas, estoque_tampas, estoque_rotulos) 
WHERE estoque_garrafas < 200 OR estoque_tampas < 200 OR estoque_rotulos < 200;

-- Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'produtos'
    AND column_name IN ('estoque_garrafas', 'estoque_tampas', 'estoque_rotulos')
ORDER BY column_name;
