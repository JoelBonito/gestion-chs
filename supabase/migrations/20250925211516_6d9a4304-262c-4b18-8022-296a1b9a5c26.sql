-- Simplificar políticas RLS para Rosa e Felipe funcionar

-- 1. Remover TODAS as políticas SELECT de encomendas
DROP POLICY IF EXISTS "encomendas_select" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_select_rosa_colaborador" ON public.encomendas;
DROP POLICY IF EXISTS "felipe_encomendas_somente_fornecedores_permitidos" ON public.encomendas;
DROP POLICY IF EXISTS "outros_encomendas_leitura_total" ON public.encomendas;

-- 2. Criar uma ÚNICA política unificada que funcione para todos
CREATE POLICY "encomendas_select_unified" 
ON public.encomendas 
FOR SELECT 
TO public
USING (
  -- Admins podem ver tudo
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  -- Felipe e Rosa só veem fornecedores específicos
  (
    auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
    AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )
  OR
  -- Outros usuários veem suas próprias encomendas
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
);

-- 3. Fazer o mesmo para produtos
DROP POLICY IF EXISTS "produtos_select_policy" ON public.produtos;
DROP POLICY IF EXISTS "produtos_select_rosa_colaborador" ON public.produtos;

CREATE POLICY "produtos_select_unified" 
ON public.produtos 
FOR SELECT 
TO public
USING (
  -- Admins podem ver tudo
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text])
  OR
  -- Felipe e Rosa só veem fornecedores específicos
  (
    auth.email() = ANY (ARRAY['felipe@colaborador.com'::text, 'rosa@colaborador.com'::text])
    AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )
  OR
  -- Outros usuários veem seus próprios produtos
  (
    auth.email() NOT IN ('felipe@colaborador.com', 'rosa@colaborador.com')
    AND created_by = auth.uid()
  )
);