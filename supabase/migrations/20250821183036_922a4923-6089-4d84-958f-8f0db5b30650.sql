
-- Renomear campo tamanho para size_label e adicionar peso unitário em produtos
ALTER TABLE public.produtos 
RENAME COLUMN tamanho TO size_label;

ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS unit_weight_kg numeric(10,2);

-- Adicionar campos de peso nos itens de encomenda (snapshot do peso no momento do pedido)
ALTER TABLE public.itens_encomenda 
ADD COLUMN IF NOT EXISTS unit_weight_kg_at_order numeric(10,2),
ADD COLUMN IF NOT EXISTS line_weight_kg numeric(10,2);

-- Adicionar campos de peso e frete nas encomendas
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS total_weight_kg numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight_multiplier numeric(10,2) DEFAULT 1.3,
ADD COLUMN IF NOT EXISTS adjusted_weight_kg numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS freight_rate_currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS freight_rate_per_kg numeric(10,2) DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS freight_value numeric(10,2) DEFAULT 0;

-- Criar tabela de tarifas de frete
CREATE TABLE IF NOT EXISTS public.freight_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin text NOT NULL,
  destination text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  rate_per_kg numeric(10,2) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(origin, destination, currency)
);

-- Inserir tarifa padrão São Paulo → Marselha
INSERT INTO public.freight_rates (origin, destination, currency, rate_per_kg, active)
VALUES ('São Paulo', 'Marselha', 'EUR', 4.5, true)
ON CONFLICT (origin, destination, currency) DO NOTHING;

-- RLS para freight_rates
ALTER TABLE public.freight_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view freight rates" 
ON public.freight_rates 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admin and finance can manage freight rates" 
ON public.freight_rates 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

-- Função para calcular peso da linha do item
CREATE OR REPLACE FUNCTION public.calculate_line_weight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se unit_weight_kg_at_order não estiver preenchido, buscar do produto
  IF NEW.unit_weight_kg_at_order IS NULL THEN
    SELECT unit_weight_kg INTO NEW.unit_weight_kg_at_order
    FROM public.produtos 
    WHERE id = NEW.produto_id;
  END IF;
  
  -- Calcular peso da linha
  NEW.line_weight_kg = COALESCE(NEW.quantidade, 0) * COALESCE(NEW.unit_weight_kg_at_order, 0);
  
  RETURN NEW;
END;
$function$;

-- Função para recalcular totais de peso e frete da encomenda
CREATE OR REPLACE FUNCTION public.recalculate_order_weight_and_freight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_id uuid;
  total_weight numeric;
  adjusted_weight numeric;
  freight_cost numeric;
  multiplier numeric;
  rate_per_kg numeric;
BEGIN
  -- Determinar o ID da encomenda
  IF TG_OP = 'DELETE' THEN
    order_id = OLD.encomenda_id;
  ELSE
    order_id = NEW.encomenda_id;
  END IF;
  
  -- Calcular peso total dos itens
  SELECT 
    COALESCE(SUM(line_weight_kg), 0),
    e.weight_multiplier,
    e.freight_rate_per_kg
  INTO total_weight, multiplier, rate_per_kg
  FROM public.encomendas e
  LEFT JOIN public.itens_encomenda ie ON ie.encomenda_id = e.id
  WHERE e.id = order_id
  GROUP BY e.id, e.weight_multiplier, e.freight_rate_per_kg;
  
  -- Calcular peso ajustado e valor do frete
  adjusted_weight = total_weight * COALESCE(multiplier, 1.3);
  freight_cost = adjusted_weight * COALESCE(rate_per_kg, 4.5);
  
  -- Atualizar encomenda
  UPDATE public.encomendas 
  SET 
    total_weight_kg = total_weight,
    adjusted_weight_kg = adjusted_weight,
    freight_value = freight_cost,
    updated_at = now()
  WHERE id = order_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Triggers para cálculo automático de peso
CREATE TRIGGER trigger_calculate_line_weight
  BEFORE INSERT OR UPDATE ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_line_weight();

CREATE TRIGGER trigger_recalculate_order_weight_insert
  AFTER INSERT ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_order_weight_and_freight();

CREATE TRIGGER trigger_recalculate_order_weight_update
  AFTER UPDATE ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_order_weight_and_freight();

CREATE TRIGGER trigger_recalculate_order_weight_delete
  AFTER DELETE ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_order_weight_and_freight();

-- Trigger para recalcular quando multiplicador ou tarifa mudar na encomenda
CREATE TRIGGER trigger_recalculate_freight_on_order_change
  AFTER UPDATE OF weight_multiplier, freight_rate_per_kg ON public.encomendas
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_order_weight_and_freight();

-- Adicionar trigger para updated_at em freight_rates
CREATE TRIGGER update_freight_rates_updated_at
  BEFORE UPDATE ON public.freight_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
