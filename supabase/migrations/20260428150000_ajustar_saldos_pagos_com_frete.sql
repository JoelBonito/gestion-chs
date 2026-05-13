-- Migration: Ajustar valor_pago de encomendas pagas para incluir frete
-- Created: 2026-04-28
-- Description: Após corrigir o bug onde valor_total não incluía frete,
--              encomendas que estavam pagas (saldo=0) voltaram a aparecer
--              com saldo pendente igual ao valor do frete.
--              Esta migration ajusta o valor_pago dessas encomendas para
--              igualar o valor_total corrigido, restaurando saldo=0.
--
-- Critério de segurança:
--   - Só afeta encomendas com valor_frete > 0
--   - Só afeta encomendas onde valor_pago cobria os itens (estava paga sem frete)
--   - NÃO afeta encomendas com saldo real (pagamentos parciais)

-- 1. Desativar trigger temporariamente para evitar recálculo automático
ALTER TABLE public.pagamentos DISABLE TRIGGER trigger_atualizar_valor_pago_encomenda;

-- 2. Ajustar valor_pago das encomendas que estavam pagas (sem frete) para agora incluírem o frete
--    Condição: valor_pago >= (valor_total - valor_frete)  →  cobria os itens
--    Condição: valor_pago < valor_total                   →  agora tem saldo pendente por causa do frete
UPDATE public.encomendas
SET valor_pago = valor_total
WHERE valor_frete > 0
  AND valor_pago >= (valor_total - valor_frete - 0.01)
  AND valor_pago < valor_total;

-- 3. Reativar trigger
ALTER TABLE public.pagamentos ENABLE TRIGGER trigger_atualizar_valor_pago_encomenda;

-- 4. Garantir que saldo_devedor e saldo_devedor_fornecedor estejam consistentes
--    (colunas GENERATED, mas forçamos recálculo via UPDATE dummy se necessário)
UPDATE public.encomendas
SET updated_at = NOW()
WHERE valor_frete > 0
  AND saldo_devedor < 0.01
  AND saldo_devedor > -0.01;
