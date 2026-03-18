-- Add preco_nonato column to produtos table
-- This is a secondary cost reference, manually filled
-- lucro_nonato is computed on the frontend: (preco_venda - preco_nonato) / 2
ALTER TABLE public.produtos
ADD COLUMN preco_nonato DECIMAL(10,2) DEFAULT NULL;
