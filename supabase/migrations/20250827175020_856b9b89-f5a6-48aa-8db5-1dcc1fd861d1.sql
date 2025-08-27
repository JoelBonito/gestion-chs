-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.calcular_saldo_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.saldo_devedor_fornecedor = NEW.valor_total_custo - NEW.valor_pago_fornecedor;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Recalcular o valor_pago_fornecedor da encomenda
  IF TG_OP = 'DELETE' THEN
    UPDATE public.encomendas 
    SET valor_pago_fornecedor = COALESCE((
      SELECT SUM(valor_pagamento) 
      FROM public.pagamentos_fornecedor 
      WHERE encomenda_id = OLD.encomenda_id
    ), 0)
    WHERE id = OLD.encomenda_id;
    RETURN OLD;
  ELSE
    UPDATE public.encomendas 
    SET valor_pago_fornecedor = COALESCE((
      SELECT SUM(valor_pagamento) 
      FROM public.pagamentos_fornecedor 
      WHERE encomenda_id = NEW.encomenda_id
    ), 0)
    WHERE id = NEW.encomenda_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_encomenda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Recalcular o valor_pago da encomenda
  IF TG_OP = 'DELETE' THEN
    UPDATE public.encomendas 
    SET valor_pago = COALESCE((
      SELECT SUM(valor_pagamento) 
      FROM public.pagamentos 
      WHERE encomenda_id = OLD.encomenda_id
    ), 0)
    WHERE id = OLD.encomenda_id;
    RETURN OLD;
  ELSE
    UPDATE public.encomendas 
    SET valor_pago = COALESCE((
      SELECT SUM(valor_pagamento) 
      FROM public.pagamentos 
      WHERE encomenda_id = NEW.encomenda_id
    ), 0)
    WHERE id = NEW.encomenda_id;
    RETURN NEW;
  END IF;
END;
$$;