
-- Criar bucket para anexos no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true);

-- Criar políticas RLS para o bucket attachments
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Atualizar tabela attachments para usar Supabase Storage
ALTER TABLE attachments 
DROP COLUMN gdrive_file_id,
DROP COLUMN gdrive_view_link,
DROP COLUMN gdrive_download_link,
ADD COLUMN storage_path text NOT NULL DEFAULT '',
ADD COLUMN storage_url text NOT NULL DEFAULT '';
