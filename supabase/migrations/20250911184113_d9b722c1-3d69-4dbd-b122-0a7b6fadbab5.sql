-- Drop existing policy first, then create a clean one
DROP POLICY IF EXISTS "produtos_select_policy" ON public.produtos;

-- Create a comprehensive SELECT policy for produtos
CREATE POLICY "produtos_select_policy" ON public.produtos
FOR SELECT USING (
  -- Admin users can see all products
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text]))
  -- Felipe can only see products from specific suppliers
  OR ((auth.email() = 'felipe@colaborador.com'::text) AND (fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])))
  -- All other users can see products they created
  OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);