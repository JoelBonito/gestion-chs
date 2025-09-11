-- Add separate observation columns for Joel and Felipe
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS observacoes_joel text,
ADD COLUMN IF NOT EXISTS observacoes_felipe text;