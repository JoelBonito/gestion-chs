-- Adicionar coluna etiqueta na tabela encomendas
ALTER TABLE public.encomendas ADD COLUMN IF NOT EXISTS etiqueta VARCHAR(100);

-- Criar índice para otimizar buscas por etiqueta
CREATE INDEX IF NOT EXISTS idx_encomendas_etiqueta ON public.encomendas (etiqueta);

-- Verificar se as políticas RLS existentes já permitem SELECT da nova coluna
-- (As políticas existentes usam * então já incluem a nova coluna automaticamente)