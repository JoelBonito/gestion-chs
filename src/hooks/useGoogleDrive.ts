
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
      // Simulate upload for now since Google Drive API requires OAuth2
      // In a real implementation, you would need proper OAuth2 flow
      console.log("Simulando upload do arquivo:", file.name);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 20;
          if (next >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return next;
        });
      }, 200);

      // Wait for "upload" to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock Google Drive links (in production, these would come from actual Google Drive)
      const mockFileId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result: GoogleDriveUploadResult = {
        fileId: mockFileId,
        webViewLink: `https://drive.google.com/file/d/${mockFileId}/view`,
        downloadLink: `https://drive.google.com/uc?export=download&id=${mockFileId}`,
        name: file.name,
        mimeType: file.type,
        size: file.size
      };

      toast({
        title: "Upload simulado com sucesso",
        description: `Arquivo ${file.name} processado. Nota: Em produção, seria necessário configurar OAuth2 do Google Drive.`,
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
