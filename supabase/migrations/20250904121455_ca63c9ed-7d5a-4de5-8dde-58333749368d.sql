-- Primeiro, vou atualizar as policies de encomendas para restringir felipe@colaborador.com

-- Atualizar policy de encomendas para permitir UPDATE apenas se não for felipe@colaborador.com
DROP POLICY IF EXISTS "encomendas_all" ON public.encomendas;

CREATE POLICY "encomendas_select" ON public.encomendas
FOR SELECT USING (
  (created_by = auth.uid()) OR (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]))
);

CREATE POLICY "encomendas_insert" ON public.encomendas  
FOR INSERT WITH CHECK (
  (created_by = auth.uid()) OR (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text]))
);

CREATE POLICY "encomendas_update" ON public.encomendas
FOR UPDATE USING (
  ((created_by = auth.uid()) OR (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])))
  AND auth.email() != 'felipe@colaborador.com'
) WITH CHECK (
  ((created_by = auth.uid()) OR (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])))
  AND auth.email() != 'felipe@colaborador.com'
);

CREATE POLICY "encomendas_delete" ON public.encomendas
FOR DELETE USING (
  ((created_by = auth.uid()) OR (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])))
  AND auth.email() != 'felipe@colaborador.com'
);