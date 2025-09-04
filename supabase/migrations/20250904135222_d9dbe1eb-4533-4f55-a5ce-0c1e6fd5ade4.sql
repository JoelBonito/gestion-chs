-- Update RLS policy for encomendas to allow collaborator to update status and dates
DROP POLICY IF EXISTS "encomendas_update" ON public.encomendas;

CREATE POLICY "encomendas_update" 
ON public.encomendas 
FOR UPDATE 
USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) OR 
  (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid()) OR
  (auth.email() = 'felipe@colaborador.com'::text) -- Allow collaborator to update any order
);