-- Add preco_custo column to itens_encomenda table
ALTER TABLE public.itens_encomenda 
ADD COLUMN preco_custo numeric NOT NULL DEFAULT 0;

-- Update existing records to use the cost price from produtos table
UPDATE public.itens_encomenda 
SET preco_custo = produtos.preco_custo
FROM public.produtos 
WHERE itens_encomenda.produto_id = produtos.id;