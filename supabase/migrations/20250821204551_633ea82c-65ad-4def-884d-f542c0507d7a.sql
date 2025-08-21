
-- Remover a coluna line_weight_kg da tabela itens_encomenda
ALTER TABLE public.itens_encomenda DROP COLUMN IF EXISTS line_weight_kg;

-- Remover a coluna unit_weight_kg_at_order da tabela itens_encomenda
ALTER TABLE public.itens_encomenda DROP COLUMN IF EXISTS unit_weight_kg_at_order;

-- Atualizar a função de calcular datas estimadas para usar 45 e 60 dias
CREATE OR REPLACE FUNCTION public.calcular_datas_estimadas_encomenda()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set estimated production date to 45 days from creation date
  NEW.data_producao_estimada = NEW.data_criacao + INTERVAL '45 days';
  
  -- Set estimated shipping date to 60 days from creation date  
  NEW.data_envio_estimada = NEW.data_criacao + INTERVAL '60 days';
  
  RETURN NEW;
END;
$function$
