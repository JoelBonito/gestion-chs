-- Limpar TODAS as policies existentes antes de recriar
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Dropar todas as policies das tabelas principais
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 1. Adicionar coluna created_by onde ainda não existe
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. Criar função e triggers para preencher created_by automaticamente
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

-- Aplicar triggers
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

-- 3. Backfill dados antigos
UPDATE public.encomendas 
SET created_by = (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE created_by IS NULL;

UPDATE public.fornecedores 
SET created_by = (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE created_by IS NULL;

UPDATE public.clientes 
SET created_by = (SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE created_by IS NULL;

-- 4. POLICIES PARA ENCOMENDAS
CREATE POLICY "encomendas_all" ON public.encomendas
FOR ALL USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 5. POLICIES PARA ITENS_ENCOMENDA
CREATE POLICY "itens_all" ON public.itens_encomenda
FOR ALL USING (
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

-- 6. POLICIES PARA PAGAMENTOS
CREATE POLICY "pagamentos_all" ON public.pagamentos
FOR ALL USING (
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

-- 7. POLICIES PARA PAGAMENTOS_FORNECEDOR
CREATE POLICY "pagamentos_fornecedor_all" ON public.pagamentos_fornecedor
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos_fornecedor.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.encomendas e
    WHERE e.id = pagamentos_fornecedor.encomenda_id
    AND (e.created_by = auth.uid() OR auth.email() IN ('jbento1@gmail.com', 'admin@admin.com'))
  )
);

-- 8. POLICIES PARA FRETE_ENCOMENDA
CREATE POLICY "frete_all" ON public.frete_encomenda
FOR ALL USING (
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

-- 9. POLICIES PARA FORNECEDORES
CREATE POLICY "fornecedores_all" ON public.fornecedores
FOR ALL USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 10. POLICIES PARA CLIENTES
CREATE POLICY "clientes_all" ON public.clientes
FOR ALL USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 11. POLICIES PARA PRODUTOS
CREATE POLICY "produtos_all" ON public.produtos
FOR ALL USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 12. POLICIES PARA ATTACHMENTS
CREATE POLICY "attachments_all" ON public.attachments
FOR ALL USING (
  uploaded_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  uploaded_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 13. POLICIES PARA INVOICES
CREATE POLICY "invoices_all" ON public.invoices
FOR ALL USING (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  created_by = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);

-- 14. POLICIES PARA ACTIVITY_LOG
CREATE POLICY "activity_log_all" ON public.activity_log
FOR ALL USING (
  by_user = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
) WITH CHECK (
  by_user = auth.uid() OR 
  auth.email() IN ('jbento1@gmail.com', 'admin@admin.com')
);