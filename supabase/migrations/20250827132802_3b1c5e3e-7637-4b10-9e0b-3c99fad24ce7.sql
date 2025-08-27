-- Fix RLS policies to use user_roles table instead of profiles table

-- Drop conflicting policies for fornecedores
DROP POLICY IF EXISTS "Admins podem inserir fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Admins podem ver fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Admins podem atualizar fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Admins podem deletar fornecedores" ON public.fornecedores;

-- Drop old policies for clientes and produtos
DROP POLICY IF EXISTS "Admins podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem deletar clientes" ON public.clientes;

DROP POLICY IF EXISTS "Admins podem inserir produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins podem ver produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins podem atualizar produtos" ON public.produtos;
DROP POLICY IF EXISTS "Admins podem deletar produtos" ON public.produtos;

-- Create new policies using user_roles table for CLIENTES
CREATE POLICY "Enable all operations for authenticated users" ON public.clientes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ops')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ops')
  )
);

-- Create new policies using user_roles table for PRODUTOS  
CREATE POLICY "Enable all operations for authenticated users" ON public.produtos
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ops')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ops')
  )
);

-- Keep the existing fornecedores_all policy which already works correctly
-- But make sure RLS is enabled
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Add policy for invoices
CREATE POLICY "Enable all operations for authenticated users" ON public.invoices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ops', 'finance')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ops', 'finance')
  )
);