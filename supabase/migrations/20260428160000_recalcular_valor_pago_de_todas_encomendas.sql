-- Migration: Recalcular valor_pago de todas as encomendas baseado nos pagamentos reais
-- Created: 2026-04-28
-- Description: Corrige desincronização entre encomendas.valor_pago e a soma real
--              dos pagamentos na tabela pagamentos. Isso pode ocorrer quando a
--              trigger trigger_atualizar_valor_pago_encomenda falha ou é desativada
--              temporariamente.
--              Esta migration é idempotente e pode ser executada várias vezes.

-- 1. Recalcular valor_pago de TODAS as encomendas baseado nos pagamentos reais
UPDATE public.encomendas e
SET valor_pago = COALESCE((
  SELECT SUM(p.valor_pagamento)
  FROM public.pagamentos p
  WHERE p.encomenda_id = e.id
), 0);

-- 2. Recalcular valor_pago_fornecedor de TODAS as encomendas baseado nos pagamentos_fornecedor reais
UPDATE public.encomendas e
SET valor_pago_fornecedor = COALESCE((
  SELECT SUM(pf.valor_pagamento)
  FROM public.pagamentos_fornecedor pf
  WHERE pf.encomenda_id = e.id
), 0);

-- 3. Forçar recálculo dos saldos (colunas GENERATED)
--    Fazendo um UPDATE dummy no updated_at para disparar as triggers BEFORE UPDATE
UPDATE public.encomendas
SET updated_at = NOW()
WHERE id IN (
  SELECT id FROM public.encomendas
  WHERE COALESCE(valor_total, 0) - COALESCE(valor_pago, 0) != COALESCE(saldo_devedor, 0)
     OR COALESCE(valor_total_custo, 0) - COALESCE(valor_pago_fornecedor, 0) != COALESCE(saldo_devedor_fornecedor, 0)
);
