-- Corrigir problemas de segurança: definir search_path nas funções
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_encomenda()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.atualizar_valor_total_encomenda()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalcular o valor_total da encomenda
  IF TG_OP = 'DELETE' THEN
    UPDATE public.encomendas 
    SET valor_total = COALESCE((
      SELECT SUM(subtotal) 
      FROM public.itens_encomenda 
      WHERE encomenda_id = OLD.encomenda_id
    ), 0)
    WHERE id = OLD.encomenda_id;
    RETURN OLD;
  ELSE
    UPDATE public.encomendas 
    SET valor_total = COALESCE((
      SELECT SUM(subtotal) 
      FROM public.itens_encomenda 
      WHERE encomenda_id = NEW.encomenda_id
    ), 0)
    WHERE id = NEW.encomenda_id;
    RETURN NEW;
  END IF;
END;
$$;