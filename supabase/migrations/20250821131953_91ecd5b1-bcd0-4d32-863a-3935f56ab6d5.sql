-- Criar trigger para calcular subtotal automaticamente
CREATE OR REPLACE FUNCTION public.calcular_subtotal_item()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.quantidade * NEW.preco_unitario;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa antes de INSERT e UPDATE
CREATE TRIGGER trigger_calcular_subtotal
  BEFORE INSERT OR UPDATE ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_subtotal_item();