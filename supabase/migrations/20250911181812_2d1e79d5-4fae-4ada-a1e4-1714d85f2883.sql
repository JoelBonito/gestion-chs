-- Add missing triggers to keep financial fields consistent and backfill data

-- 1) Triggers on encomendas to keep updated_at
DROP TRIGGER IF EXISTS trg_encomendas_updated_at ON public.encomendas;
CREATE TRIGGER trg_encomendas_updated_at
BEFORE UPDATE ON public.encomendas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Triggers for pagamentos to keep valor_pago in encomendas
DROP TRIGGER IF EXISTS trg_pagamentos_after_write ON public.pagamentos;
CREATE TRIGGER trg_pagamentos_after_write
AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_pago_encomenda();

DROP TRIGGER IF EXISTS trg_pagamentos_updated_at ON public.pagamentos;
CREATE TRIGGER trg_pagamentos_updated_at
BEFORE UPDATE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Triggers for pagamentos_fornecedor to keep valor_pago_fornecedor
DROP TRIGGER IF EXISTS trg_pagamentos_fornecedor_after_write ON public.pagamentos_fornecedor;
CREATE TRIGGER trg_pagamentos_fornecedor_after_write
AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos_fornecedor
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_pago_fornecedor();

DROP TRIGGER IF EXISTS trg_pagamentos_fornecedor_updated_at ON public.pagamentos_fornecedor;
CREATE TRIGGER trg_pagamentos_fornecedor_updated_at
BEFORE UPDATE ON public.pagamentos_fornecedor
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Triggers for itens_encomenda to keep totals and cost
DROP TRIGGER IF EXISTS trg_itens_calc_subtotal ON public.itens_encomenda;
CREATE TRIGGER trg_itens_calc_subtotal
BEFORE INSERT OR UPDATE ON public.itens_encomenda
FOR EACH ROW EXECUTE FUNCTION public.calcular_subtotal_item();

DROP TRIGGER IF EXISTS trg_itens_update_total ON public.itens_encomenda;
CREATE TRIGGER trg_itens_update_total
AFTER INSERT OR UPDATE OR DELETE ON public.itens_encomenda
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_total_encomenda();

DROP TRIGGER IF EXISTS trg_itens_recalc_custo_tr ON public.itens_encomenda;
CREATE TRIGGER trg_itens_recalc_custo_tr
AFTER INSERT OR UPDATE OR DELETE ON public.itens_encomenda
FOR EACH ROW EXECUTE FUNCTION public.trg_itens_recalc_custo();

-- 5) Triggers for frete_encomenda: update totals and costs
DROP TRIGGER IF EXISTS trg_frete_update_total ON public.frete_encomenda;
CREATE TRIGGER trg_frete_update_total
AFTER INSERT OR UPDATE ON public.frete_encomenda
FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_total_com_frete();

DROP TRIGGER IF EXISTS trg_frete_recalc_cost ON public.frete_encomenda;
CREATE TRIGGER trg_frete_recalc_cost
AFTER INSERT OR UPDATE OR DELETE ON public.frete_encomenda
FOR EACH ROW EXECUTE FUNCTION public.trg_frete_recalc_custo();

-- 6) Backfill data so current rows show correct values
-- Recalculate valor_pago from pagamentos
UPDATE public.encomendas e
SET valor_pago = COALESCE((
  SELECT SUM(p.valor_pagamento)
  FROM public.pagamentos p
  WHERE p.encomenda_id = e.id
), 0);

-- Recalculate valor_total from itens_encomenda + valor_frete
UPDATE public.encomendas e
SET valor_total = COALESCE((
  SELECT SUM(i.subtotal)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = e.id
), 0) + COALESCE(e.valor_frete, 0);

-- Recalculate supplier amounts
UPDATE public.encomendas e
SET valor_pago_fornecedor = COALESCE((
  SELECT SUM(pf.valor_pagamento)
  FROM public.pagamentos_fornecedor pf
  WHERE pf.encomenda_id = e.id
), 0);

UPDATE public.encomendas e
SET valor_total_custo = COALESCE((
  SELECT SUM(i.quantidade * i.preco_custo)
  FROM public.itens_encomenda i
  WHERE i.encomenda_id = e.id
), 0);

-- Update supplier balance (this one can be updated)
UPDATE public.encomendas
SET saldo_devedor_fornecedor = COALESCE(valor_total_custo, 0) - COALESCE(valor_pago_fornecedor, 0);