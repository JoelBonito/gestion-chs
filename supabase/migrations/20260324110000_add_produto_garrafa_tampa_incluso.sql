-- Add flags to indicate garrafa/tampa are included in producao_nonato cost on product level
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS garrafa_incluso boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tampa_incluso boolean DEFAULT false;
