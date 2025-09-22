-- Verificar e ajustar políticas RLS para visualização de pagamentos

-- Para tabela pagamentos (pagamentos de clientes)
-- Permitir visualização para todos os usuários autenticados que têm acesso à encomenda
DROP POLICY IF EXISTS "pagamentos_select_secure" ON public.pagamentos;

CREATE POLICY "pagamentos_select_all_authenticated" 
ON public.pagamentos 
FOR SELECT 
TO authenticated
USING (
  -- Permitir se o usuário tem acesso à encomenda relacionada
  EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = pagamentos.encomenda_id
    AND (
      -- Admins podem ver tudo
      auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
      OR
      -- Outros usuários podem ver suas próprias encomendas
      (auth.email() <> 'felipe@colaborador.com'::text AND e.created_by = auth.uid())
      OR
      -- Felipe pode ver encomendas dos fornecedores específicos
      (auth.email() = 'felipe@colaborador.com'::text AND e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid]))
    )
  )
);

-- Para tabela pagamentos_fornecedor
-- Permitir visualização para todos os usuários autenticados que têm acesso à encomenda
DROP POLICY IF EXISTS "pagamentos_fornecedor_select_restricted" ON public.pagamentos_fornecedor;

CREATE POLICY "pagamentos_fornecedor_select_all_authenticated" 
ON public.pagamentos_fornecedor 
FOR SELECT 
TO authenticated
USING (
  -- Permitir se o usuário tem acesso à encomenda relacionada
  EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = pagamentos_fornecedor.encomenda_id
    AND (
      -- Admins podem ver tudo
      auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
      OR
      -- Outros usuários podem ver suas próprias encomendas
      (auth.email() <> 'felipe@colaborador.com'::text AND e.created_by = auth.uid())
      OR
      -- Felipe pode ver encomendas dos fornecedores específicos
      (auth.email() = 'felipe@colaborador.com'::text AND e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid]))
    )
  )
);