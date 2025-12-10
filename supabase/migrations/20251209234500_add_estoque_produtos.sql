-- Add inventory columns to produtos table
ALTER TABLE public.produtos
ADD COLUMN estoque_garrafas INTEGER NOT NULL DEFAULT 0,
ADD COLUMN estoque_tampas INTEGER NOT NULL DEFAULT 0,
ADD COLUMN estoque_rotulos INTEGER NOT NULL DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.produtos.estoque_garrafas IS 'Quantidade de garrafas/potes em estoque';
COMMENT ON COLUMN public.produtos.estoque_tampas IS 'Quantidade de tampas em estoque';
COMMENT ON COLUMN public.produtos.estoque_rotulos IS 'Quantidade de rótulos em estoque';

-- Create index for better performance when filtering by stock levels
CREATE INDEX idx_produtos_estoque_baixo ON public.produtos(estoque_garrafas, estoque_tampas, estoque_rotulos) 
WHERE estoque_garrafas < 200 OR estoque_tampas < 200 OR estoque_rotulos < 200;
