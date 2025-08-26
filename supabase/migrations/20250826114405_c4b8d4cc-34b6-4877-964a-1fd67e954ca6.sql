
-- Create table for file attachments
CREATE TABLE public.attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('produto', 'financeiro', 'encomenda')),
  entity_id uuid NOT NULL,
  gdrive_file_id text NOT NULL UNIQUE,
  name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/jpg')),
  web_view_link text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing attachments - all authenticated users can view
CREATE POLICY "Users can view attachments" 
  ON public.attachments 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Policy for creating attachments - only admin, ops, and finance roles
CREATE POLICY "Admin, ops and finance can create attachments" 
  ON public.attachments 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'ops') OR 
      public.has_role(auth.uid(), 'finance')
    )
  );

-- Policy for deleting attachments - only admin, ops, and finance roles
CREATE POLICY "Admin, ops and finance can delete attachments" 
  ON public.attachments 
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'ops') OR 
      public.has_role(auth.uid(), 'finance')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
