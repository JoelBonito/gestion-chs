
-- Create a table for supplier payments
CREATE TABLE public.pagamentos_fornecedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encomenda_id UUID NOT NULL REFERENCES public.encomendas(id) ON DELETE CASCADE,
  valor_pagamento NUMERIC NOT NULL,
  forma_pagamento VARCHAR NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos_fornecedor ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (matching other tables in the system)
CREATE POLICY "Permitir acesso total a pagamentos_fornecedor" 
  ON public.pagamentos_fornecedor 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_pagamentos_fornecedor_updated_at 
  BEFORE UPDATE ON public.pagamentos_fornecedor 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update valor_pago_fornecedor in encomendas table
CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_fornecedor()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update valor_pago_fornecedor
CREATE TRIGGER trigger_atualizar_valor_pago_fornecedor
  AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos_fornecedor
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_valor_pago_fornecedor();

-- Add columns to encomendas table for supplier payment tracking
ALTER TABLE public.encomendas 
ADD COLUMN IF NOT EXISTS valor_total_custo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_pago_fornecedor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_devedor_fornecedor NUMERIC DEFAULT 0;

-- Create function to calculate supplier balance
CREATE OR REPLACE FUNCTION public.calcular_saldo_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
  NEW.saldo_devedor_fornecedor = NEW.valor_total_custo - NEW.valor_pago_fornecedor;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate supplier balance
CREATE TRIGGER trigger_calcular_saldo_fornecedor
  BEFORE INSERT OR UPDATE ON public.encomendas
  FOR EACH ROW EXECUTE FUNCTION public.calcular_saldo_fornecedor();
