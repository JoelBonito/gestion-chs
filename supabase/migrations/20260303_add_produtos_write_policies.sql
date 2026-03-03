-- Add missing write policies for produtos table
-- Currently only SELECT policies exist, blocking all write operations

-- 1. INSERT Policy - Allow authenticated users to create products
CREATE POLICY "produtos_insert_policy"
ON public.produtos
FOR INSERT
TO public
WITH CHECK (
  -- Only authenticated users can insert
  auth.uid() IS NOT NULL
);

-- 2. UPDATE Policy - Allow authenticated users to update products
CREATE POLICY "produtos_update_policy"
ON public.produtos
FOR UPDATE
TO public
USING (
  -- Same visibility rules as SELECT
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  (
    auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
    AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )
  OR
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  -- Same check as USING
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  (
    auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
    AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )
  OR
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
);

-- 3. DELETE Policy - Allow authenticated users to delete products
CREATE POLICY "produtos_delete_policy"
ON public.produtos
FOR DELETE
TO public
USING (
  -- Same visibility rules as SELECT
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  (
    auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
    AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )
  OR
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
);
