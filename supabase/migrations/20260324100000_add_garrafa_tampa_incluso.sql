-- Add flags to indicate garrafa/tampa are included in producao_nonato cost
ALTER TABLE custos_producao_encomenda
ADD COLUMN IF NOT EXISTS garrafa_incluso boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tampa_incluso boolean DEFAULT false;
