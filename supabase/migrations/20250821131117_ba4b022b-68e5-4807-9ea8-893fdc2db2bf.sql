-- Adicionar campos de datas estimadas na tabela encomendas
ALTER TABLE public.encomendas 
ADD COLUMN data_producao_estimada date,
ADD COLUMN data_entrega_estimada date;