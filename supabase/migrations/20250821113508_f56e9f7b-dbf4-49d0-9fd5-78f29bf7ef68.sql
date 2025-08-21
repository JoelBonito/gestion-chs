-- Criar tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  marca VARCHAR(255) NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  tamanho VARCHAR(100) NOT NULL,
  preco_custo DECIMAL(10,2) NOT NULL,
  preco_venda DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso (por enquanto permitindo tudo para usuários autenticados)
CREATE POLICY "Usuários podem ver produtos" 
ON public.produtos 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem criar produtos" 
ON public.produtos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar produtos" 
ON public.produtos 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários podem deletar produtos" 
ON public.produtos 
FOR DELETE 
USING (true);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualização automática de timestamps
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();