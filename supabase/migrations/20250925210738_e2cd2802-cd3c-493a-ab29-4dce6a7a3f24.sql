-- Corrigir políticas conflitantes para Rosa

-- 1. Atualizar política de outros usuários para excluir Rosa
DROP POLICY IF EXISTS "outros_encomendas_leitura_total" ON public.encomendas;
CREATE POLICY "outros_encomendas_leitura_total" 
ON public.encomendas 
FOR SELECT 
TO public
USING (
  auth.email() <> 'felipe@colaborador.com' 
  AND auth.email() <> 'rosa@colaborador.com'
);

-- 2. Atualizar política de produtos para excluir Rosa da política geral
DROP POLICY IF EXISTS "produtos_select_policy" ON public.produtos;
CREATE POLICY "produtos_select_policy" 
ON public.produtos 
FOR SELECT 
TO public
USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text]))
  OR 
  ((auth.email() = 'felipe@colaborador.com'::text) AND (fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])))
  OR 
  ((auth.email() <> 'felipe@colaborador.com'::text AND auth.email() <> 'rosa@colaborador.com'::text) AND (created_by = auth.uid()))
);