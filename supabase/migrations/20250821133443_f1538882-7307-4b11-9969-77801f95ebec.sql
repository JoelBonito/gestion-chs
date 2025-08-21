-- Adicionar campo status_producao na tabela encomendas
ALTER TABLE public.encomendas 
ADD COLUMN status_producao VARCHAR(20) DEFAULT 'PEDIDO' CHECK (status_producao IN ('PEDIDO', 'PRODUCAO', 'ENTREGA'));