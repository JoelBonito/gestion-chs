-- Add custo_producao and lucro_joel fields to produtos table
-- These replace the visible pricing model (old fields kept for history)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS custo_producao numeric DEFAULT NULL;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS lucro_joel numeric DEFAULT NULL;
