-- Remover a política de update antiga que bloqueia Felipe
DROP POLICY IF EXISTS "transportes_update" ON public.transportes;

-- Criar nova política que permite Felipe editar seus próprios registros ou registros que ele precisa atualizar
CREATE POLICY "transportes_update" 
ON public.transportes
FOR UPDATE
USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR (created_by = auth.uid())
  OR (auth.email() = 'felipe@colaborador.com'::text)
);