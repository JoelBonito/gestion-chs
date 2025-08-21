-- Create function to calculate estimated dates for orders
CREATE OR REPLACE FUNCTION public.calcular_datas_estimadas_encomenda()
RETURNS TRIGGER AS $$
BEGIN
  -- Set estimated production date to 45 days from creation date
  NEW.data_producao_estimada = NEW.data_criacao + INTERVAL '45 days';
  
  -- Set estimated shipping date to 60 days from creation date  
  NEW.data_envio_estimada = NEW.data_criacao + INTERVAL '60 days';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate estimated dates on insert
CREATE TRIGGER trigger_calcular_datas_estimadas
  BEFORE INSERT ON public.encomendas
  FOR EACH ROW
  EXECUTE FUNCTION public.calcular_datas_estimadas_encomenda();