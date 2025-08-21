-- Drop the dangerous open policy that allows public access to customer data
DROP POLICY IF EXISTS "Permitir acesso total a clientes" ON public.clientes;

-- Create secure RLS policies that require authentication
-- Only authenticated users can view customer data
CREATE POLICY "Authenticated users can view customers" 
ON public.clientes 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can create customer records
CREATE POLICY "Authenticated users can create customers" 
ON public.clientes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update customer records
CREATE POLICY "Authenticated users can update customers" 
ON public.clientes 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Only authenticated users can delete customer records
CREATE POLICY "Authenticated users can delete customers" 
ON public.clientes 
FOR DELETE 
TO authenticated 
USING (true);