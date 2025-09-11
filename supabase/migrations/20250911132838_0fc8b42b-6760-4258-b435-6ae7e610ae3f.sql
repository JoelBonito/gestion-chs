-- Criar tabela de anexos para transportes seguindo o padrão existente
CREATE TABLE IF NOT EXISTS public.transporte_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporte_id UUID NOT NULL REFERENCES public.transportes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT '',
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.transporte_attachments ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS seguindo o padrão das outras tabelas
CREATE POLICY "transporte_attachments_select" 
ON public.transporte_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "transporte_attachments_insert" 
ON public.transporte_attachments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "transporte_attachments_update" 
ON public.transporte_attachments 
FOR UPDATE 
USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR (uploaded_by = auth.uid())
);

CREATE POLICY "transporte_attachments_delete" 
ON public.transporte_attachments 
FOR DELETE 
USING (
  (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) 
  OR (uploaded_by = auth.uid())
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_transporte_attachments_transporte_id 
ON public.transporte_attachments(transporte_id);