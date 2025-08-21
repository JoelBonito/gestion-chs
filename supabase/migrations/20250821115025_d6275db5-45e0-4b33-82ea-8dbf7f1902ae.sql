-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  email VARCHAR,
  telefone VARCHAR,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  contato VARCHAR,
  telefone VARCHAR,
  email VARCHAR,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de encomendas
CREATE TABLE public.encomendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_encomenda VARCHAR UNIQUE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_devedor DECIMAL(10,2) GENERATED ALWAYS AS (valor_total - valor_pago) STORED,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_entrega DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de itens da encomenda (produtos)
CREATE TABLE public.itens_encomenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encomenda_id UUID REFERENCES public.encomendas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de pagamentos
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encomenda_id UUID REFERENCES public.encomendas(id) NOT NULL,
  valor_pagamento DECIMAL(10,2) NOT NULL,
  forma_pagamento VARCHAR NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_encomenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitir acesso total por enquanto)
CREATE POLICY "Permitir acesso total a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a encomendas" ON public.encomendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a itens_encomenda" ON public.itens_encomenda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a pagamentos" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);

-- Criar função para atualizar saldo da encomenda após inserir/atualizar/deletar pagamento
CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_encomenda()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar valor_pago automaticamente
CREATE TRIGGER trigger_atualizar_valor_pago_encomenda
  AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_valor_pago_encomenda();

-- Criar função para atualizar valor_total da encomenda
CREATE OR REPLACE FUNCTION public.atualizar_valor_total_encomenda()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar valor_total automaticamente
CREATE TRIGGER trigger_atualizar_valor_total_encomenda
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_valor_total_encomenda();

-- Criar triggers para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_encomendas_updated_at
  BEFORE UPDATE ON public.encomendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();