-- Add custo_nonato_breakdown JSONB column to produtos table
-- Stores individual cost components in BRL for preco_nonato calculation
-- Structure: { embalagem, tampa, rotulo, producao_nonato, frete_sp, manuseio_carol, imposto }
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS custo_nonato_breakdown JSONB DEFAULT NULL;
