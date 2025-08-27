-- Add foreign key constraint between itens_encomenda and produtos
ALTER TABLE public.itens_encomenda 
ADD CONSTRAINT fk_itens_encomenda_produto_id 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id);