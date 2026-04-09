-- Allow authenticated users to read active and inactive products.
-- This is required for the "Mostrar Inativos" toggle in Produtos page.

DROP POLICY IF EXISTS "Authenticated users can view all active products" ON public.produtos;
DROP POLICY IF EXISTS "Users can select their own active produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.produtos;

CREATE POLICY "Authenticated users can view all products"
ON public.produtos
FOR SELECT
USING (auth.role() = 'authenticated');
