-- Corrigir políticas RLS da tabela attachments para usar user_roles

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins podem inserir attachments" ON public.attachments;
DROP POLICY IF EXISTS "Admins podem ver attachments" ON public.attachments;
DROP POLICY IF EXISTS "Admins podem atualizar attachments" ON public.attachments;
DROP POLICY IF EXISTS "Admins podem deletar attachments" ON public.attachments;

-- Criar novas políticas usando user_roles
CREATE POLICY "Enable insert for authenticated users with admin or ops role" 
ON public.attachments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
);

CREATE POLICY "Enable select for authenticated users with admin or ops role" 
ON public.attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
);

CREATE POLICY "Enable update for authenticated users with admin or ops role" 
ON public.attachments FOR UPDATE 
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

CREATE POLICY "Enable delete for authenticated users with admin or ops role" 
ON public.attachments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'ops', 'finance')
  )
);