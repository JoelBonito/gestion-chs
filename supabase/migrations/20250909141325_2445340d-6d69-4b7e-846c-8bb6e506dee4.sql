-- Criar tabela de projetos
CREATE TABLE public.projetos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  observacoes TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- Create policies for projeto access - only specific admin emails
CREATE POLICY "projetos_select" 
ON public.projetos 
FOR SELECT 
USING (auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com']));

CREATE POLICY "projetos_insert" 
ON public.projetos 
FOR INSERT 
WITH CHECK (auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com']));

CREATE POLICY "projetos_update" 
ON public.projetos 
FOR UPDATE 
USING (auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com']));

CREATE POLICY "projetos_delete" 
ON public.projetos 
FOR DELETE 
USING (auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com']));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projetos_updated_at
BEFORE UPDATE ON public.projetos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();