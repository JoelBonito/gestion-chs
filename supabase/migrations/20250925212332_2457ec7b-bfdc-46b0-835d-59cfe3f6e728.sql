-- Corrigir visibilidade de clientes para Rosa e Felipe

-- Atualizar a política de clientes para permitir que Rosa e Felipe vejam todos os clientes
-- (necessário para mostrar nomes dos clientes nas encomendas)
DROP POLICY IF EXISTS "clientes_select_restricted" ON public.clientes;

CREATE POLICY "clientes_select_policy" 
ON public.clientes 
FOR SELECT 
TO public
USING (
  -- Admins podem ver todos os clientes
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  -- Felipe e Rosa podem ver todos os clientes (necessário para nomes nas encomendas)
  auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
  OR
  -- Outros usuários veem apenas clientes que criaram
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
);