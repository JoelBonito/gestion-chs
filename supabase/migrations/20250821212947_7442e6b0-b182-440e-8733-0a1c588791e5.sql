
-- Adicionar campo de frete na tabela encomendas
ALTER TABLE public.encomendas 
ADD COLUMN valor_frete numeric DEFAULT 0,
ADD COLUMN peso_total numeric DEFAULT 0,
ADD COLUMN frete_calculado boolean DEFAULT false;

-- Criar tabela para armazenar informações de frete
CREATE TABLE public.frete_encomenda (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encomenda_id uuid NOT NULL,
  descricao text NOT NULL DEFAULT 'FRETE SÃO PAULO - MARSELHA',
  peso_total numeric NOT NULL,
  valor_frete numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela frete_encomenda
ALTER TABLE public.frete_encomenda ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total ao frete
CREATE POLICY "Permitir acesso total ao frete" 
ON public.frete_encomenda 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger para atualizar updated_at na tabela frete_encomenda
CREATE TRIGGER update_frete_encomenda_updated_at
  BEFORE UPDATE ON public.frete_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para recalcular valor total incluindo frete
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_com_frete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Recalcular o valor_total da encomenda incluindo frete
  UPDATE public.encomendas 
  SET valor_total = COALESCE((
    SELECT SUM(subtotal) 
    FROM public.itens_encomenda 
    WHERE encomenda_id = NEW.encomenda_id
  ), 0) + COALESCE(NEW.valor_frete, 0)
  WHERE id = NEW.encomenda_id;
  
  RETURN NEW;
END;
$function$;

-- Trigger para atualizar valor total quando frete for alterado
CREATE TRIGGER trigger_atualizar_valor_total_com_frete
  AFTER INSERT OR UPDATE ON public.frete_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_valor_total_com_frete();
