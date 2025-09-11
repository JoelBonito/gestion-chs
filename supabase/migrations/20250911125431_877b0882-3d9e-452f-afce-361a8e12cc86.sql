-- Create transportes table
CREATE TABLE public.transportes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number BIGINT NOT NULL,
  referencia TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.transportes ENABLE ROW LEVEL SECURITY;

-- Create policies for transportes
CREATE POLICY "transportes_select" 
ON public.transportes 
FOR SELECT 
USING (true);

CREATE POLICY "transportes_insert" 
ON public.transportes 
FOR INSERT 
WITH CHECK (auth.email() <> 'felipe@colaborador.com'::text);

CREATE POLICY "transportes_update" 
ON public.transportes 
FOR UPDATE 
USING ((auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid())));

CREATE POLICY "transportes_delete" 
ON public.transportes 
FOR DELETE 
USING ((auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])) OR ((auth.email() <> 'felipe@colaborador.com'::text) AND (created_by = auth.uid())));

-- Create trigger for updated_at
CREATE TRIGGER update_transportes_updated_at
BEFORE UPDATE ON public.transportes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();