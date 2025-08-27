-- Fix remaining functions with search_path
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_encomenda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.calcular_subtotal_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.subtotal = NEW.quantidade * NEW.preco_unitario;
  RETURN NEW;
END;
$$;