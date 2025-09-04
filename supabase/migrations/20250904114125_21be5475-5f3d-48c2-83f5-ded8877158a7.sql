-- 1. Adicionar coluna created_by onde ainda não existe
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
-- encomendas já tem created_by

-- 2. Criar trigger para preencher created_by automaticamente
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS set_created_by_encomendas ON public.encomendas;
CREATE TRIGGER set_created_by_encomendas
  BEFORE INSERT ON public.encomendas
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_created_by_fornecedores ON public.fornecedores;
CREATE TRIGGER set_created_by_fornecedores
  BEFORE INSERT ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

DROP TRIGGER IF EXISTS set_created_by_clientes ON public.clientes;
CREATE TRIGGER set_created_by_clientes
  BEFORE INSERT ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- 3. Backfill dados antigos (usando o primeiro admin como padrão)
UPDATE public.encomendas 
SET created_by = (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE created_by IS NULL;

UPDATE public.fornecedores 
SET created_by = (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE created_by IS NULL;

UPDATE public.clientes 
SET created_by = (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE created_by IS NULL;

-- 4. Dropar policies existentes para recriar
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.encomendas;
DROP POLICY IF EXISTS "Users can insert their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can update their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Users can delete their own encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Admins and ops can manage all orders" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_select_own" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_insert_own" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_update_delete_own" ON public.encomendas;
DROP POLICY IF EXISTS "encomendas_delete_own" ON public.encomendas;

-- Policies para encomendas
CREATE POLICY "encomendas_select" ON public.encomendas
FOR SELECT USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "encomendas_insert" ON public.encomendas
FOR INSERT WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "encomendas_update" ON public.encomendas
FOR UPDATE USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "encomendas_delete" ON public.encomendas
FOR DELETE USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 5. Policies para itens_encomenda
DROP POLICY IF EXISTS "Authenticated users can view all order items" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Users can insert itens to their own encomendas" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Users can update itens from their own encomendas" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Users can delete itens from their own encomendas" ON public.itens_encomenda;
DROP POLICY IF EXISTS "itens_select_by_owner" ON public.itens_encomenda;
DROP POLICY IF EXISTS "itens_insert_by_owner" ON public.itens_encomenda;
DROP POLICY IF EXISTS "itens_update_by_owner" ON public.itens_encomenda;
DROP POLICY IF EXISTS "itens_delete_by_owner" ON public.itens_encomenda;

CREATE POLICY "itens_select" ON public.itens_encomenda
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = itens_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "itens_insert" ON public.itens_encomenda
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = itens_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "itens_update" ON public.itens_encomenda
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = itens_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = itens_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "itens_delete" ON public.itens_encomenda
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = itens_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

-- 6. Policies para pagamentos
DROP POLICY IF EXISTS "Enable all operations for financial users on pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "pay_delete_on_parent" ON public.pagamentos;
DROP POLICY IF EXISTS "pgto_select_by_owner" ON public.pagamentos;
DROP POLICY IF EXISTS "pgto_insert_by_owner" ON public.pagamentos;
DROP POLICY IF EXISTS "pgto_update_by_owner" ON public.pagamentos;
DROP POLICY IF EXISTS "pgto_delete_by_owner" ON public.pagamentos;

CREATE POLICY "pagamentos_select" ON public.pagamentos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "pagamentos_insert" ON public.pagamentos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "pagamentos_update" ON public.pagamentos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "pagamentos_delete" ON public.pagamentos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

-- 7. Policies para frete_encomenda
DROP POLICY IF EXISTS "Enable all operations for financial users on frete_encomenda" ON public.frete_encomenda;
DROP POLICY IF EXISTS "frete_select_by_owner" ON public.frete_encomenda;
DROP POLICY IF EXISTS "frete_insert_by_owner" ON public.frete_encomenda;
DROP POLICY IF EXISTS "frete_update_by_owner" ON public.frete_encomenda;
DROP POLICY IF EXISTS "frete_delete_by_owner" ON public.frete_encomenda;

CREATE POLICY "frete_select" ON public.frete_encomenda
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = frete_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "frete_insert" ON public.frete_encomenda
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = frete_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "frete_update" ON public.frete_encomenda
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = frete_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = frete_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

CREATE POLICY "frete_delete" ON public.frete_encomenda
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = frete_encomenda.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

-- 8. Policies para fornecedores
DROP POLICY IF EXISTS "Authenticated users can view all active suppliers" ON public.fornecedores;
DROP POLICY IF EXISTS "Users can insert their own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Users can update their own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Users can delete their own fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "forn_select_own" ON public.fornecedores;
DROP POLICY IF EXISTS "forn_insert_own" ON public.fornecedores;
DROP POLICY IF EXISTS "forn_update_own" ON public.fornecedores;
DROP POLICY IF EXISTS "forn_delete_own" ON public.fornecedores;

CREATE POLICY "fornecedores_select" ON public.fornecedores
FOR SELECT USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "fornecedores_insert" ON public.fornecedores
FOR INSERT WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "fornecedores_update" ON public.fornecedores
FOR UPDATE USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "fornecedores_delete" ON public.fornecedores
FOR DELETE USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 9. Policies para clientes
DROP POLICY IF EXISTS "Authenticated users can view all active clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can update their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete their own clientes" ON public.clientes;
DROP POLICY IF EXISTS "cli_select_own" ON public.clientes;
DROP POLICY IF EXISTS "cli_insert_own" ON public.clientes;
DROP POLICY IF EXISTS "cli_update_own" ON public.clientes;
DROP POLICY IF EXISTS "cli_delete_own" ON public.clientes;

CREATE POLICY "clientes_select" ON public.clientes
FOR SELECT USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "clientes_insert" ON public.clientes
FOR INSERT WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "clientes_update" ON public.clientes
FOR UPDATE USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

CREATE POLICY "clientes_delete" ON public.clientes
FOR DELETE USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);