-- Fix ENC014 Nonato payment: was registered as 2532.20 EUR, should be 2500 EUR (= 15000 BRL)
UPDATE pagamentos_fornecedor
SET valor_pagamento = 2500
WHERE encomenda_id = (SELECT id FROM encomendas WHERE numero_encomenda = 'ENC014')
AND destinatario = 'nonato';

-- Update exchange rate to match: 15000 BRL / 2500 EUR = 6
-- (rate is already 6, no change needed)
