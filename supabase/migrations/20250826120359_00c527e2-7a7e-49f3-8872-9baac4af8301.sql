
-- Create attachments table to store file metadata
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('produto', 'financeiro', 'pagamento')),
  entity_id text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'jpeg')),
  gdrive_file_id text NOT NULL,
  gdrive_view_link text NOT NULL,
  gdrive_download_link text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for attachments
CREATE POLICY "Users can view attachments" ON public.attachments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create attachments" ON public.attachments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own attachments" ON public.attachments
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own attachments" ON public.attachments
  FOR DELETE USING (uploaded_by = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_user ON public.attachments(uploaded_by);
