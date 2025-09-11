-- Grant ham@admin.com read access to clientes so joins in Sales tab return rows
DROP POLICY IF EXISTS "clientes_select_restricted" ON public.clientes;
CREATE POLICY "clientes_select_restricted" ON public.clientes
FOR SELECT USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text]))
  OR ((auth.email() = 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
  OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

-- Optionally allow ham@admin.com to manage clientes like other admins
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
CREATE POLICY "clientes_update" ON public.clientes
FOR UPDATE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text]))
  OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;
CREATE POLICY "clientes_delete" ON public.clientes
FOR DELETE USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'ham@admin.com'::text]))
  OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid()))
);

DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert" ON public.clientes
FOR INSERT WITH CHECK (
  (auth.email() <> 'felipe@colaborador.com'::text)
);
