-- Clean up conflicting RLS policies on produtos table
-- Remove all existing SELECT policies
DROP POLICY IF EXISTS "produtos_select" ON public.produtos;
DROP POLICY IF EXISTS "felipe_produtos_somente_fornecedores_permitidos" ON public.produtos;
DROP POLICY IF EXISTS "outros_produtos_leitura_total" ON public.produtos;

-- Create a single comprehensive SELECT policy
CREATE POLICY "produtos_select_policy" ON public.produtos
FOR SELECT USING (
  -- Admin users can see all products
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text]))
  -- Felipe can only see products from specific suppliers
  OR ((auth.email() = 'felipe@colaborador.com'::text) AND (fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])))
  -- All other users can see products they created
  OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);