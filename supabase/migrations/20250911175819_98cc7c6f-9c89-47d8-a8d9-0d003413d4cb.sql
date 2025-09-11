-- Fix security vulnerability in clientes table SELECT policy
-- Current policy allows public read access to sensitive customer data
-- Replace with restrictive policy that only allows access to:
-- 1. Admin users (jbento1@gmail.com, admin@admin.com)  
-- 2. Users who created the client record
-- 3. Exclude Felipe from accessing clients he didn't create

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;

-- Create new restrictive SELECT policy
CREATE POLICY "clientes_select_restricted" 
ON public.clientes 
FOR SELECT 
USING (
  -- Admin users can see all clients
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR 
  -- Non-Felipe users can see clients they created
  ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
  OR
  -- Felipe can only see clients he specifically created  
  ((auth.email() = 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);