
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupabaseUploadResult {
  path: string;
  fullPath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export const useSupabaseStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (
    file: File, 
    entityType?: string, 
    entityId?: string
  ): Promise<SupabaseUploadResult | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Iniciando upload para Supabase Storage:', { 
        fileName: file.name, 
        size: file.size, 
        type: file.type,
        entityType,
        entityId 
      });

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Create file path with user ID and timestamp to avoid conflicts
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${user.id}/${entityType || 'general'}/${fileName}`;

      console.log('Caminho do arquivo:', filePath);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (error) {
        console.error('Erro no upload:', error);
        throw error;
      }

      console.log('Upload bem-sucedido:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      setUploadProgress(100);

      const result: SupabaseUploadResult = {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrlData.publicUrl,
        fileName: file.name,
        mimeType: file.type,
        size: file.size
      };

      console.log('Resultado do upload:', result);
      
      toast({
        title: "Upload concluído",
        description: "Arquivo enviado com sucesso para o Supabase Storage.",
      });

      return result;

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload do arquivo.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('attachments')
        .remove([filePath]);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        throw error;
      }

      console.log('Arquivo deletado com sucesso:', filePath);
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      toast({
        title: "Erro ao deletar",
        description: error.message || "Erro ao deletar arquivo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress
  };
};
