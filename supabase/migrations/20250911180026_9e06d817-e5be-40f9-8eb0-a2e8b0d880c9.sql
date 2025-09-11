-- Fix security vulnerabilities in financial tables
-- Drop existing policies and create new restrictive ones

-- 1. Fix pagamentos table - drop existing and recreate
DROP POLICY IF EXISTS "pagamentos_select_restricted" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_select" ON public.pagamentos;

CREATE POLICY "pagamentos_select_secure" 
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

-- 2. Fix invoices table - drop existing and recreate  
DROP POLICY IF EXISTS "invoices_select_restricted" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;

CREATE POLICY "invoices_select_secure" 
ON public.invoices 
FOR SELECT 
USING (
  -- Admin users can see all invoices
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR 
  -- Non-Felipe users can see invoices they created
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

-- 3. Fix invoices_backup table - drop existing and recreate
DROP POLICY IF EXISTS "invoices_backup_select_restricted" ON public.invoices_backup;
DROP POLICY IF EXISTS "invoices_backup_select" ON public.invoices_backup;

CREATE POLICY "invoices_backup_select_secure" 
ON public.invoices_backup 
FOR SELECT 
USING (
  -- Only admin users can access backup invoice data
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]))
);