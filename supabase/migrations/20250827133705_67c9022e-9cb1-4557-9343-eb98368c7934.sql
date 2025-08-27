-- First, delete orphaned records that reference non-existent products
DELETE FROM public.itens_encomenda 
WHERE produto_id NOT IN (SELECT id FROM public.produtos);

-- Now add the foreign key constraint
ALTER TABLE public.itens_encomenda 
ADD CONSTRAINT fk_itens_encomenda_produto_id 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id);