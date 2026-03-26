-- Add is_bonificacao flag to itens_encomenda
ALTER TABLE public.itens_encomenda
  ADD COLUMN IF NOT EXISTS is_bonificacao BOOLEAN NOT NULL DEFAULT false;
