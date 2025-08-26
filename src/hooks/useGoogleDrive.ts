
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleDriveUploadResult {
  fileId: string;
  webViewLink: string;
  downloadLink: string;
  name: string;
  mimeType: string;
  size: number;
}

export const useGoogleDrive = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const getGoogleDriveApiKey = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'GOOGLE_DRIVE_API_KEY' }
      });
      
      if (error) throw error;
      return data?.value || null;
    } catch (error) {
      console.error('Error getting Google Drive API key:', error);
      return null;
    }
  };

  const uploadFile = async (file: File): Promise<GoogleDriveUploadResult | null> => {
    if (!file) return null;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não permitido",
        description: "Apenas arquivos PDF e JPG são aceitos.",
        variant: "destructive"
      });
      return null;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const apiKey = await getGoogleDriveApiKey();
      if (!apiKey) {
        throw new Error('Google Drive API key not found');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Create form data for upload
      const formData = new FormData();
      const metadata = {
        name: file.name,
        parents: ['1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'] // Use a specific folder or remove for root
      };

      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      // Upload to Google Drive
      const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Google Drive upload failed: ${errorData.error?.message || uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      
      // Make the file publicly accessible
      await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: GoogleDriveUploadResult = {
        fileId: uploadResult.id,
        webViewLink: `https://drive.google.com/file/d/${uploadResult.id}/view`,
        downloadLink: `https://drive.google.com/uc?export=download&id=${uploadResult.id}`,
        name: uploadResult.name,
        mimeType: file.type,
        size: file.size
      };

      toast({
        title: "Upload realizado com sucesso",
        description: `Arquivo ${file.name} enviado para o Google Drive.`,
      });

      return result;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao fazer upload do arquivo.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress
  };
};
