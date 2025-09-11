-- Fix security vulnerabilities in financial tables
-- All financial tables currently have "Using Expression: true" for SELECT
-- which allows public read access to sensitive financial data
-- Replace with restrictive policies following the app's role-based access pattern

-- 1. Fix pagamentos table
DROP POLICY IF EXISTS "pagamentos_select" ON public.pagamentos;
CREATE POLICY "pagamentos_select_restricted" 
ON public.pagamentos 
FOR SELECT 
USING (
  -- Admin users can see all payments
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR 
  -- Non-Felipe users can see payments for orders they created
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (EXISTS ( 
    SELECT 1 FROM encomendas e 
    WHERE e.id = pagamentos.encomenda_id AND e.created_by = auth.uid()
  )))
  OR
  -- Felipe can see payments only for allowed suppliers
  ((auth.email() = 'felipe@colaborador.com'::text) AND (EXISTS ( 
    SELECT 1 FROM encomendas e 
    WHERE e.id = pagamentos.encomenda_id 
    AND e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )))
);

-- 2. Fix pagamentos_fornecedor table 
DROP POLICY IF EXISTS "pagamentos_fornecedor_select" ON public.pagamentos_fornecedor;
CREATE POLICY "pagamentos_fornecedor_select_restricted" 
ON public.pagamentos_fornecedor 
FOR SELECT 
USING (
  -- Admin users can see all supplier payments
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR 
  -- Non-Felipe users can see supplier payments for orders they created
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (EXISTS ( 
    SELECT 1 FROM encomendas e 
    WHERE e.id = pagamentos_fornecedor.encomenda_id AND e.created_by = auth.uid()
  )))
  OR
  -- Felipe can see supplier payments only for allowed suppliers
  ((auth.email() = 'felipe@colaborador.com'::text) AND (EXISTS ( 
    SELECT 1 FROM encomendas e 
    WHERE e.id = pagamentos_fornecedor.encomenda_id 
    AND e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )))
);

-- 3. Fix invoices table
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
CREATE POLICY "invoices_select_restricted" 
ON public.invoices 
FOR SELECT 
USING (
  -- Admin users can see all invoices
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR 
  -- Non-Felipe users can see invoices they created
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

-- 4. Fix invoices_backup table
DROP POLICY IF EXISTS "invoices_backup_select" ON public.invoices_backup;
CREATE POLICY "invoices_backup_select_restricted" 
ON public.invoices_backup 
FOR SELECT 
USING (
  -- Only admin users can access backup invoice data
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]))
);