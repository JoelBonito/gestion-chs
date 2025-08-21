
-- Atualizar políticas RLS da tabela clientes para permitir acesso público
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.clientes;

-- Criar novas políticas que permitem acesso público
CREATE POLICY "Allow public access to create customers" ON public.clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public access to view customers" ON public.clientes
  FOR SELECT USING (true);

CREATE POLICY "Allow public access to update customers" ON public.clientes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to delete customers" ON public.clientes
  FOR DELETE USING (true);
