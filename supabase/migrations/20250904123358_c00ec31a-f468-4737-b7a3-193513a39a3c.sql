-- Update RLS policies to allow all users to view all data
-- but maintain edit/delete restrictions for felipe@colaborador.com

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "produtos_all" ON public.produtos;
DROP POLICY IF EXISTS "clientes_all" ON public.clientes;
DROP POLICY IF EXISTS "fornecedores_all" ON public.fornecedores;
DROP POLICY IF EXISTS "encomendas_select" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_insert" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_update" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_delete" ON public.encomendas;
DROP POLICY IF EXISTS "itens_all" ON public.itens_encomenda;
DROP POLICY IF EXISTS "pagamentos_all" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_fornecedor_all" ON public.pagamentos_fornecedor;
DROP POLICY IF EXISTS "frete_all" ON public.frete_encomenda;
DROP POLICY IF EXISTS "attachments_all" ON public.attachments;
DROP POLICY IF EXISTS "activity_log_all" ON public.activity_log;
DROP POLICY IF EXISTS "invoices_all" ON public.invoices;

-- PRODUTOS: All can view, admins + non-collaborators can edit
CREATE POLICY "produtos_select" ON public.produtos
FOR SELECT USING (true);

CREATE POLICY "produtos_insert" ON public.produtos
FOR INSERT WITH CHECK (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  auth.email() <> 'felipe@colaborador.com'::text
);

CREATE POLICY "produtos_update" ON public.produtos
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

CREATE POLICY "produtos_delete" ON public.produtos
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

-- CLIENTES: All can view, felipe@colaborador.com blocked
CREATE POLICY "clientes_select" ON public.clientes
FOR SELECT USING (true);

CREATE POLICY "clientes_insert" ON public.clientes
FOR INSERT WITH CHECK (auth.email() <> 'felipe@colaborador.com'::text);

CREATE POLICY "clientes_update" ON public.clientes
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

CREATE POLICY "clientes_delete" ON public.clientes
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

-- FORNECEDORES: All can view, felipe@colaborador.com blocked
CREATE POLICY "fornecedores_select" ON public.fornecedores
FOR SELECT USING (true);

CREATE POLICY "fornecedores_insert" ON public.fornecedores
FOR INSERT WITH CHECK (auth.email() <> 'felipe@colaborador.com'::text);

CREATE POLICY "fornecedores_update" ON public.fornecedores
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

CREATE POLICY "fornecedores_delete" ON public.fornecedores
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

-- ENCOMENDAS: All can view, felipe@colaborador.com cannot edit/delete
CREATE POLICY "encomendas_select" ON public.encomendas
FOR SELECT USING (true);

CREATE POLICY "encomendas_insert" ON public.encomendas
FOR INSERT WITH CHECK (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  auth.email() <> 'felipe@colaborador.com'::text
);

CREATE POLICY "encomendas_update" ON public.encomendas
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

CREATE POLICY "encomendas_delete" ON public.encomendas
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

-- ITENS_ENCOMENDA: All can view, felipe@colaborador.com cannot edit directly
CREATE POLICY "itens_select" ON public.itens_encomenda
FOR SELECT USING (true);

CREATE POLICY "itens_insert" ON public.itens_encomenda
FOR INSERT WITH CHECK (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  auth.email() <> 'felipe@colaborador.com'::text
);

CREATE POLICY "itens_update" ON public.itens_encomenda
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = itens_encomenda.encomenda_id AND e.created_by = auth.uid()
  ))
);

CREATE POLICY "itens_delete" ON public.itens_encomenda
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = itens_encomenda.encomenda_id AND e.created_by = auth.uid()
  ))
);

-- PAGAMENTOS: All can view, felipe@colaborador.com cannot edit
CREATE POLICY "pagamentos_select" ON public.pagamentos
FOR SELECT USING (true);

CREATE POLICY "pagamentos_insert" ON public.pagamentos
FOR INSERT WITH CHECK (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  auth.email() <> 'felipe@colaborador.com'::text
);

CREATE POLICY "pagamentos_update" ON public.pagamentos
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = pagamentos.encomenda_id AND e.created_by = auth.uid()
  ))
);

CREATE POLICY "pagamentos_delete" ON public.pagamentos
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = pagamentos.encomenda_id AND e.created_by = auth.uid()
  ))
);

-- PAGAMENTOS_FORNECEDOR: All can view and manage
CREATE POLICY "pagamentos_fornecedor_select" ON public.pagamentos_fornecedor
FOR SELECT USING (true);

CREATE POLICY "pagamentos_fornecedor_insert" ON public.pagamentos_fornecedor
FOR INSERT WITH CHECK (true);

CREATE POLICY "pagamentos_fornecedor_update" ON public.pagamentos_fornecedor
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = pagamentos_fornecedor.encomenda_id AND e.created_by = auth.uid()
  )
);

CREATE POLICY "pagamentos_fornecedor_delete" ON public.pagamentos_fornecedor
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = pagamentos_fornecedor.encomenda_id AND e.created_by = auth.uid()
  )
);

-- FRETE_ENCOMENDA: All can view and manage
CREATE POLICY "frete_select" ON public.frete_encomenda
FOR SELECT USING (true);

CREATE POLICY "frete_insert" ON public.frete_encomenda
FOR INSERT WITH CHECK (true);

CREATE POLICY "frete_update" ON public.frete_encomenda
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = frete_encomenda.encomenda_id AND e.created_by = auth.uid()
  )
);

CREATE POLICY "frete_delete" ON public.frete_encomenda
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = frete_encomenda.encomenda_id AND e.created_by = auth.uid()
  )
);

-- ATTACHMENTS: All can view, manage based on ownership or admin
CREATE POLICY "attachments_select" ON public.attachments
FOR SELECT USING (true);

CREATE POLICY "attachments_insert" ON public.attachments
FOR INSERT WITH CHECK (true);

CREATE POLICY "attachments_update" ON public.attachments
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  uploaded_by = auth.uid()
);

CREATE POLICY "attachments_delete" ON public.attachments
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  uploaded_by = auth.uid()
);

-- ACTIVITY_LOG: All can view, all can insert, admins can manage
CREATE POLICY "activity_log_select" ON public.activity_log
FOR SELECT USING (true);

CREATE POLICY "activity_log_insert" ON public.activity_log
FOR INSERT WITH CHECK (true);

CREATE POLICY "activity_log_update" ON public.activity_log
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])
);

CREATE POLICY "activity_log_delete" ON public.activity_log
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])
);

-- INVOICES: All can view, manage based on ownership or admin
CREATE POLICY "invoices_select" ON public.invoices
FOR SELECT USING (true);

CREATE POLICY "invoices_insert" ON public.invoices
FOR INSERT WITH CHECK (
  auth.email() <> 'felipe@colaborador.com'::text
);

CREATE POLICY "invoices_update" ON public.invoices
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

CREATE POLICY "invoices_delete" ON public.invoices
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]) OR
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);