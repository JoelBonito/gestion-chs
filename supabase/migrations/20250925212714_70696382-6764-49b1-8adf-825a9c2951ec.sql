-- Alterar a política existente de clientes para incluir Rosa e Felipe

-- Remover a política SELECT atual
DROP POLICY IF EXISTS "clientes_select_policy" ON public.clientes;

-- Recriar com acesso correto para Rosa e Felipe
CREATE POLICY "clientes_select_policy" 
ON public.clientes 
FOR SELECT 
TO public
USING (
  -- Admins podem ver todos os clientes
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  -- Felipe e Rosa podem ver todos os clientes (necessário para exibir nomes nas encomendas)
  auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
  OR
  -- Outros usuários autenticados veem apenas clientes que criaram
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
);