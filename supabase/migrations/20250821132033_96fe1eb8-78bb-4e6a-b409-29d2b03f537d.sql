-- Corrigir função com search_path seguro
CREATE OR REPLACE FUNCTION public.calcular_subtotal_item()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.quantidade * NEW.preco_unitario;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;