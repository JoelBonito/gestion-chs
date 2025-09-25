-- Corrigir problemas de visualização de dados para Rosa e Felipe

-- 1. Verificar e corrigir políticas de encomendas para usuários específicos
DROP POLICY IF EXISTS "encomendas_select_rosa_colaborador" ON public.encomendas;
DROP POLICY IF EXISTS "felipe_encomendas_somente_fornecedores_permitidos" ON public.encomendas;

-- Recriar políticas com role correto (public em vez de authenticated)
CREATE POLICY "encomendas_select_rosa_colaborador" 
ON public.encomendas 
FOR SELECT 
TO public
USING (
  auth.email() = 'rosa@colaborador.com' 
  AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
);

CREATE POLICY "felipe_encomendas_somente_fornecedores_permitidos" 
ON public.encomendas 
FOR SELECT 
TO public
USING (
  auth.email() = 'felipe@colaborador.com' 
  AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
);

-- 2. Corrigir políticas de produtos da mesma forma
DROP POLICY IF EXISTS "produtos_select_rosa_colaborador" ON public.produtos;

CREATE POLICY "produtos_select_rosa_colaborador" 
ON public.produtos 
FOR SELECT 
TO public
USING (
  auth.email() = 'rosa@colaborador.com' 
  AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
);

-- 3. Adicionar debug temporário para verificar se a função auth.email() está funcionando
-- (Esta query vai falhar intencionalmente para mostrar o email do usuário atual)
-- SELECT auth.email() as current_email;