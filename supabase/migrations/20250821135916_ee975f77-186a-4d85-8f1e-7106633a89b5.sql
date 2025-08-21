-- Update function to set secure search path
CREATE OR REPLACE FUNCTION public.calcular_datas_estimadas_encomenda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set estimated production date to 45 days from creation date
  NEW.data_producao_estimada = NEW.data_criacao + INTERVAL '45 days';
  
  -- Set estimated shipping date to 60 days from creation date  
  NEW.data_envio_estimada = NEW.data_criacao + INTERVAL '60 days';
  
  RETURN NEW;
END;
$$;