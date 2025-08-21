-- Renomear coluna data_entrega_estimada para data_envio_estimada
ALTER TABLE public.encomendas 
RENAME COLUMN data_entrega_estimada TO data_envio_estimada;