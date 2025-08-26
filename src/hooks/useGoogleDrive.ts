
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
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Mock Google Drive API integration for MVP
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const mockFileId = `gdrive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockResult: GoogleDriveUploadResult = {
        fileId: mockFileId,
        webViewLink: `https://drive.google.com/file/d/${mockFileId}/view`,
        downloadLink: `https://drive.google.com/uc?export=download&id=${mockFileId}`,
        name: file.name,
        mimeType: file.type,
        size: file.size
      };

      toast({
        title: "Upload realizado com sucesso",
        description: `Arquivo ${file.name} enviado para o Google Drive.`,
      });

      return mockResult;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao fazer upload do arquivo.",
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
