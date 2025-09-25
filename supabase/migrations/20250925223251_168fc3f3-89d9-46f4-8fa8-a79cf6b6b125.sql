-- Create table for amostras (samples)
CREATE TABLE public.amostras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  referencia TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  projeto TEXT,
  tipo_produto TEXT,
  cor TEXT,
  textura TEXT,
  fragrancia TEXT,
  ingredientes_adicionais TEXT,
  quantidade_amostras INTEGER DEFAULT 1,
  data_envio DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid(),
  archived BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.amostras ENABLE ROW LEVEL SECURITY;

-- Create policies - only specific users can access
CREATE POLICY "amostras_select_allowed_users" 
ON public.amostras 
FOR SELECT 
USING (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'rosa@colaborador.com'::text, 'felipe@colaborador.com'::text]));

CREATE POLICY "amostras_insert_allowed_users" 
ON public.amostras 
FOR INSERT 
WITH CHECK (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'rosa@colaborador.com'::text, 'felipe@colaborador.com'::text]));

CREATE POLICY "amostras_update_allowed_users" 
ON public.amostras 
FOR UPDATE 
USING (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'rosa@colaborador.com'::text, 'felipe@colaborador.com'::text]));

CREATE POLICY "amostras_delete_allowed_users" 
ON public.amostras 
FOR DELETE 
USING (auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text, 'rosa@colaborador.com'::text, 'felipe@colaborador.com'::text]));

-- Create function to update updated_at column
CREATE TRIGGER update_amostras_updated_at
  BEFORE UPDATE ON public.amostras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();