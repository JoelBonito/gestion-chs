-- Criar políticas RLS para a tabela encomendas

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

-- Permitir clientes visualizarem apenas suas próprias encomendas
CREATE POLICY "Clients can view their own orders"
ON public.encomendas
FOR SELECT
USING (
  cliente_id IN (
    SELECT c.id FROM public.clientes c
    WHERE c.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'client'
  )
);

-- Permitir fábrica visualizar encomendas em produção
CREATE POLICY "Factory can view production orders"
ON public.encomendas
FOR SELECT
USING (
  status IN ('EM_PRODUCAO', 'PRODUCAO_CONCLUIDA')
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'factory'
  )
);

-- Habilitar RLS na tabela encomendas
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;