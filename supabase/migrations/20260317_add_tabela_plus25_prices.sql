-- Add pricing columns for Tabela and +25% simulators
-- These follow the same pattern as preco_nonato / custo_nonato_breakdown

ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS preco_tabela DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custo_tabela_breakdown JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preco_plus25 DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custo_plus25_breakdown JSONB DEFAULT NULL;

COMMENT ON COLUMN public.produtos.preco_tabela IS 'Preço Tabela in EUR, calculated from custo_tabela_breakdown';
COMMENT ON COLUMN public.produtos.custo_tabela_breakdown IS 'Cost breakdown for Tabela pricing (7 components in BRL)';
COMMENT ON COLUMN public.produtos.preco_plus25 IS 'Preço +25% in EUR, calculated from custo_plus25_breakdown';
COMMENT ON COLUMN public.produtos.custo_plus25_breakdown IS 'Cost breakdown for +25% pricing (7 components in BRL)';
