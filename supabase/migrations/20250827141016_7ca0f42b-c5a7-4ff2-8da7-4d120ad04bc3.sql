-- Migration for Soft Delete Implementation with Multi-Tenant Support  
-- Part 3: RLS policies with correct column names

-- Drop all existing RLS policies first
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
DROP POLICY IF EXISTS "Users can select their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can insert their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can update their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can delete their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Admins podem ver itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Admins podem inserir itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Admins podem atualizar itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Admins podem deletar itens_encomenda" ON public.itens_encomenda;

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

-- Create RLS policies for produtos (using 'ativo' column)
CREATE POLICY "Users can select their own active produtos"
ON public.produtos FOR SELECT  
USING (created_by = auth.uid() AND ativo = true);

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

-- Create RLS policies for itens_encomenda (using 'ativo' for produtos)
CREATE POLICY "Users can select itens from their own encomendas"
ON public.itens_encomenda FOR SELECT
USING (EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()));

CREATE POLICY "Users can insert itens to their own encomendas"
ON public.itens_encomenda FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.produtos WHERE id = produto_id AND created_by = auth.uid() AND ativo = true)
);

CREATE POLICY "Users can update itens from their own encomendas"
ON public.itens_encomenda FOR UPDATE  
USING (EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()) AND
  EXISTS (SELECT 1 FROM public.produtos WHERE id = produto_id AND created_by = auth.uid() AND ativo = true)
);

CREATE POLICY "Users can delete itens from their own encomendas"
ON public.itens_encomenda FOR DELETE
USING (EXISTS (SELECT 1 FROM public.encomendas WHERE id = encomenda_id AND created_by = auth.uid()));

-- Add indexes for performance  
CREATE INDEX IF NOT EXISTS idx_clientes_active ON public.clientes(active);
CREATE INDEX IF NOT EXISTS idx_clientes_created_by ON public.clientes(created_by);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_created_by ON public.produtos(created_by);
CREATE INDEX IF NOT EXISTS idx_fornecedores_active ON public.fornecedores(active);
CREATE INDEX IF NOT EXISTS idx_fornecedores_created_by ON public.fornecedores(created_by);
CREATE INDEX IF NOT EXISTS idx_encomendas_created_by ON public.encomendas(created_by);

-- Optional: Unique partial indexes for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_active_unique 
ON public.clientes(email) WHERE active = true AND email IS NOT NULL;