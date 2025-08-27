-- Remover políticas RLS antigas da tabela encomendas
DROP POLICY IF EXISTS "Admins podem inserir encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Admins podem ver encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Admins podem atualizar encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Admins podem deletar encomendas" ON public.encomendas;

-- Criar novas políticas RLS para a tabela encomendas usando user_roles
-- Permitir admins e ops criarem, visualizarem, editarem e excluírem encomendas
CREATE POLICY "Admins and ops can manage all orders"
ON public.encomendas
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'ops')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'ops')
));