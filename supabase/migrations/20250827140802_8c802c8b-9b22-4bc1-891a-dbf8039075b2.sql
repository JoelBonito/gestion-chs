-- Migration for Soft Delete Implementation with Multi-Tenant Support
-- Part 2: Foreign keys, indexes, and RLS policies

-- Add explicit foreign key constraints
-- Drop existing foreign keys if they exist and recreate with proper constraints
ALTER TABLE public.encomendas DROP CONSTRAINT IF EXISTS encomendas_cliente_id_fkey;
ALTER TABLE public.encomendas DROP CONSTRAINT IF EXISTS encomendas_fornecedor_id_fkey;
ALTER TABLE public.itens_encomenda DROP CONSTRAINT IF EXISTS itens_encomenda_encomenda_id_fkey;
ALTER TABLE public.itens_encomenda DROP CONSTRAINT IF EXISTS itens_encomenda_produto_id_fkey;

-- Add new foreign key constraints
ALTER TABLE public.encomendas
ADD CONSTRAINT encomendas_cliente_id_fkey 
FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) 
ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE public.encomendas  
ADD CONSTRAINT encomendas_fornecedor_id_fkey
FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id)
ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE public.itens_encomenda
ADD CONSTRAINT itens_encomenda_encomenda_id_fkey
FOREIGN KEY (encomenda_id) REFERENCES public.encomendas(id)
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.itens_encomenda
ADD CONSTRAINT itens_encomenda_produto_id_fkey  
FOREIGN KEY (produto_id) REFERENCES public.produtos(id)
ON UPDATE CASCADE ON DELETE RESTRICT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clientes_active ON public.clientes(active);
CREATE INDEX IF NOT EXISTS idx_clientes_created_by ON public.clientes(created_by);
CREATE INDEX IF NOT EXISTS idx_produtos_active ON public.produtos(active);
CREATE INDEX IF NOT EXISTS idx_produtos_created_by ON public.produtos(created_by);
CREATE INDEX IF NOT EXISTS idx_fornecedores_active ON public.fornecedores(active);
CREATE INDEX IF NOT EXISTS idx_fornecedores_created_by ON public.fornecedores(created_by);
CREATE INDEX IF NOT EXISTS idx_encomendas_created_by ON public.encomendas(created_by);
CREATE INDEX IF NOT EXISTS idx_encomendas_cliente_id ON public.encomendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_encomendas_fornecedor_id ON public.encomendas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_itens_encomenda_encomenda_id ON public.itens_encomenda(encomenda_id);
CREATE INDEX IF NOT EXISTS idx_itens_encomenda_produto_id ON public.itens_encomenda(produto_id);

-- Optional: Unique partial indexes for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_active_unique 
ON public.clientes(email) WHERE active = true AND email IS NOT NULL;

-- Drop existing RLS policies to recreate them
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.clientes;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can update fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can delete fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "authenticated_delete_fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "authenticated_insert_fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "authenticated_select_fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "authenticated_update_fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_all" ON public.fornecedores;
DROP POLICY IF EXISTS "Admins and ops can manage all orders" ON public.encomendas;
DROP POLICY IF EXISTS "Admins podem ver itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Admins podem inserir itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Admins podem atualizar itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Admins podem deletar itens_encomenda" ON public.itens_encomenda;

-- Enable RLS on all tables (some may already be enabled)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_encomenda ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clientes
CREATE POLICY "Users can select their own active clientes"
ON public.clientes FOR SELECT
USING (created_by = auth.uid() AND active = true);

CREATE POLICY "Users can insert their own clientes"  
ON public.clientes FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own clientes"
ON public.clientes FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own clientes"
ON public.clientes FOR DELETE
USING (created_by = auth.uid());

-- Create RLS policies for produtos
CREATE POLICY "Users can select their own active produtos"
ON public.produtos FOR SELECT  
USING (created_by = auth.uid() AND active = true);

CREATE POLICY "Users can insert their own produtos"
ON public.produtos FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own produtos"
ON public.produtos FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own produtos"
ON public.produtos FOR DELETE
USING (created_by = auth.uid());

-- Create RLS policies for fornecedores  
CREATE POLICY "Users can select their own active fornecedores"
ON public.fornecedores FOR SELECT
USING (created_by = auth.uid() AND active = true);

CREATE POLICY "Users can insert their own fornecedores"
ON public.fornecedores FOR INSERT  
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own fornecedores"
ON public.fornecedores FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own fornecedores"
ON public.fornecedores FOR DELETE
USING (created_by = auth.uid());

-- Create RLS policies for encomendas
CREATE POLICY "Users can select their own encomendas"
ON public.encomendas FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own encomendas"
ON public.encomendas FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.clientes WHERE id = cliente_id AND created_by = auth.uid() AND active = true) AND
  EXISTS (SELECT 1 FROM public.fornecedores WHERE id = fornecedor_id AND created_by = auth.uid() AND active = true)
);

CREATE POLICY "Users can update their own encomendas"  
ON public.encomendas FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.clientes WHERE id = cliente_id AND created_by = auth.uid() AND active = true) AND
  EXISTS (SELECT 1 FROM public.fornecedores WHERE id = fornecedor_id AND created_by = auth.uid() AND active = true)
);

CREATE POLICY "Users can delete their own encomendas"
ON public.encomendas FOR DELETE
USING (created_by = auth.uid());

-- Create RLS policies for itens_encomenda
CREATE POLICY "Users can select itens from their own encomendas"
ON public.itens_encomenda FOR SELECT
USING (EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()));

CREATE POLICY "Users can insert itens to their own encomendas"
ON public.itens_encomenda FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.produtos WHERE id = produto_id AND created_by = auth.uid() AND active = true)
);

CREATE POLICY "Users can update itens from their own encomendas"
ON public.itens_encomenda FOR UPDATE  
USING (EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.produtos WHERE id = produto_id AND created_by = auth.uid() AND active = true)
);

CREATE POLICY "Users can delete itens from their own encomendas"
ON public.itens_encomenda FOR DELETE
USING (EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()));

-- Add snapshot columns to encomendas for historical data
ALTER TABLE public.encomendas
ADD COLUMN IF NOT EXISTS cliente_nome_snapshot text,
ADD COLUMN IF NOT EXISTS fornecedor_nome_snapshot text;

-- Add snapshot column to itens_encomenda
ALTER TABLE public.itens_encomenda  
ADD COLUMN IF NOT EXISTS produto_nome_snapshot text;