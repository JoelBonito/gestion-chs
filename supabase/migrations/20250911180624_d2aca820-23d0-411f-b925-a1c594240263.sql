-- Fix RLS policies to include ham@admin.com for financial data access

-- Update pagamentos policies
DROP POLICY IF EXISTS "pagamentos_select_secure" ON public.pagamentos;
CREATE POLICY "pagamentos_select_secure" ON public.pagamentos
FOR SELECT USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos.encomenda_id) AND (e.created_by = auth.uid()))))) OR
  ((auth.email() = 'felipe@colaborador.com'::text) AND (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos.encomenda_id) AND (e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid]))))))
);

-- Update pagamentos_fornecedor policies
DROP POLICY IF EXISTS "pagamentos_fornecedor_select_restricted" ON public.pagamentos_fornecedor;
CREATE POLICY "pagamentos_fornecedor_select_restricted" ON public.pagamentos_fornecedor
FOR SELECT USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos_fornecedor.encomenda_id) AND (e.created_by = auth.uid()))))) OR
  ((auth.email() = 'felipe@colaborador.com'::text) AND (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos_fornecedor.encomenda_id) AND (e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid]))))))
);

-- Update invoices policies
DROP POLICY IF EXISTS "invoices_select_secure" ON public.invoices;
CREATE POLICY "invoices_select_secure" ON public.invoices
FOR SELECT USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

-- Update invoices_backup policies
DROP POLICY IF EXISTS "invoices_backup_select_secure" ON public.invoices_backup;
CREATE POLICY "invoices_backup_select_secure" ON public.invoices_backup
FOR SELECT USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
);

-- Also update other operation policies for ham@admin.com
DROP POLICY IF EXISTS "pagamentos_delete" ON public.pagamentos;
CREATE POLICY "pagamentos_delete" ON public.pagamentos
FOR DELETE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos.encomenda_id) AND (e.created_by = auth.uid())))))
);

DROP POLICY IF EXISTS "pagamentos_fornecedor_delete" ON public.pagamentos_fornecedor;
CREATE POLICY "pagamentos_fornecedor_delete" ON public.pagamentos_fornecedor
FOR DELETE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos_fornecedor.encomenda_id) AND (e.created_by = auth.uid()))))
);

DROP POLICY IF EXISTS "pagamentos_fornecedor_update" ON public.pagamentos_fornecedor;
CREATE POLICY "pagamentos_fornecedor_update" ON public.pagamentos_fornecedor
FOR UPDATE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  (EXISTS ( SELECT 1
   FROM encomendas e
  WHERE ((e.id = pagamentos_fornecedor.encomenda_id) AND (e.created_by = auth.uid()))))
);

DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;
CREATE POLICY "invoices_delete" ON public.invoices
FOR DELETE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
CREATE POLICY "invoices_update" ON public.invoices
FOR UPDATE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])) OR
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

DROP POLICY IF EXISTS "invoices_backup_delete" ON public.invoices_backup;
CREATE POLICY "invoices_backup_delete" ON public.invoices_backup
FOR DELETE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
);

DROP POLICY IF EXISTS "invoices_backup_insert" ON public.invoices_backup;
CREATE POLICY "invoices_backup_insert" ON public.invoices_backup
FOR INSERT WITH CHECK (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
);

DROP POLICY IF EXISTS "invoices_backup_update" ON public.invoices_backup;
CREATE POLICY "invoices_backup_update" ON public.invoices_backup
FOR UPDATE USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
);