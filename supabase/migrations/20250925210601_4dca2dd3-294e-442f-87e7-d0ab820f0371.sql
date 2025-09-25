-- Criar políticas RLS específicas para rosa@colaborador.com

-- 1. Política para produtos - Rosa deve ver produtos dos fornecedores específicos
DROP POLICY IF EXISTS "produtos_select_rosa_colaborador" ON public.produtos;
CREATE POLICY "produtos_select_rosa_colaborador" 
ON public.produtos 
FOR SELECT 
TO authenticated
USING (
  auth.email() = 'rosa@colaborador.com' 
  AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
);

-- 2. Política para encomendas - Rosa deve ver apenas encomendas dos fornecedores específicos
DROP POLICY IF EXISTS "encomendas_select_rosa_colaborador" ON public.encomendas;
CREATE POLICY "encomendas_select_rosa_colaborador" 
ON public.encomendas 
FOR SELECT 
TO authenticated
USING (
  auth.email() = 'rosa@colaborador.com' 
  AND fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
);

-- 3. Política para itens_encomenda - Rosa deve ver itens das encomendas permitidas
DROP POLICY IF EXISTS "itens_encomenda_select_rosa_colaborador" ON public.itens_encomenda;
CREATE POLICY "itens_encomenda_select_rosa_colaborador" 
ON public.itens_encomenda 
FOR SELECT 
TO authenticated
USING (
  auth.email() = 'rosa@colaborador.com' 
  AND EXISTS (
    SELECT 1 FROM public.encomendas e 
    WHERE e.id = itens_encomenda.encomenda_id 
    AND e.fornecedor_id = ANY (ARRAY['f0920a27-752c-4483-ba02-e7f32beceef6'::uuid, 'b8f995d2-47dc-4c8f-9779-ce21431f5244'::uuid])
  )
);