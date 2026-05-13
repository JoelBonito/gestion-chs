-- Add BRL conversion snapshot to faturas_emitidas
-- Captured at emission time from BCB PTAX (EUR sell rate)
ALTER TABLE public.faturas_emitidas
  ADD COLUMN IF NOT EXISTS taxa_conversao_brl numeric(18, 6),
  ADD COLUMN IF NOT EXISTS total_brl numeric(18, 2),
  ADD COLUMN IF NOT EXISTS data_cotacao_brl date;

COMMENT ON COLUMN public.faturas_emitidas.taxa_conversao_brl IS 'EUR->BRL PTAX sell rate on quote date (BCB)';
COMMENT ON COLUMN public.faturas_emitidas.total_brl IS 'total_pagar converted to BRL using taxa_conversao_brl';
COMMENT ON COLUMN public.faturas_emitidas.data_cotacao_brl IS 'BCB quote date (may differ from data_emissao on weekends/holidays)';
