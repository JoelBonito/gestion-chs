-- Corrigir políticas RLS das tabelas financeiras para usar user_roles

-- TABELA: pagamentos
DROP POLICY IF EXISTS "Admins podem inserir pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Admins podem ver pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Admins podem atualizar pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Admins podem deletar pagamentos" ON public.pagamentos;

CREATE POLICY "Enable all operations for financial users on pagamentos" 
ON public.pagamentos FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
);

-- TABELA: pagamentos_fornecedor
DROP POLICY IF EXISTS "Admins podem inserir pagamentos_fornecedor" ON public.pagamentos_fornecedor;
DROP POLICY IF EXISTS "Admins podem ver pagamentos_fornecedor" ON public.pagamentos_fornecedor;
DROP POLICY IF EXISTS "Admins podem atualizar pagamentos_fornecedor" ON public.pagamentos_fornecedor;
DROP POLICY IF EXISTS "Admins podem deletar pagamentos_fornecedor" ON public.pagamentos_fornecedor;

CREATE POLICY "Enable all operations for financial users on pagamentos_fornecedor" 
ON public.pagamentos_fornecedor FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
);

-- TABELA: frete_encomenda
DROP POLICY IF EXISTS "Admins podem inserir frete" ON public.frete_encomenda;
DROP POLICY IF EXISTS "Admins podem ver frete" ON public.frete_encomenda;
DROP POLICY IF EXISTS "Admins podem atualizar frete" ON public.frete_encomenda;
DROP POLICY IF EXISTS "Admins podem deletar frete" ON public.frete_encomenda;

CREATE POLICY "Enable all operations for financial users on frete_encomenda" 
ON public.frete_encomenda FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
);