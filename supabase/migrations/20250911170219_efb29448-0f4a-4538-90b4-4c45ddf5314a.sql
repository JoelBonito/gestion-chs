-- Fix security vulnerability: Restrict supplier data access
-- Replace the overly permissive SELECT policy with proper access controls

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "fornecedores_select" ON public.fornecedores;

-- Create a new restrictive SELECT policy that follows the existing security pattern
CREATE POLICY "fornecedores_select_restricted" 
ON public.fornecedores 
FOR SELECT 
USING (
  -- Admin users get full access
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR
  -- Felipe can only see specific allowed suppliers
  ((auth.email() = 'felipe@colaborador.com'::text) AND (id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])))
  OR
  -- Other authenticated users (excluding Felipe) can see all suppliers
  ((auth.email() <> 'felipe@colaborador.com'::text) AND auth.uid() IS NOT NULL)
);

-- Add a policy to ensure only authenticated users can access supplier data
CREATE POLICY "fornecedores_require_auth" 
ON public.fornecedores 
FOR ALL 
USING (auth.uid() IS NOT NULL);