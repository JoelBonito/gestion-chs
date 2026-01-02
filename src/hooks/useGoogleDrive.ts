import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const uploadFile = async (
    file: File,
    entityType?: string,
    entityId?: string
  ): Promise<GoogleDriveUploadResult | null> => {
    if (!file) return null;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não permitido",
        description: "Apenas arquivos PDF, JPG e PNG são aceitos.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log("Iniciando upload real para Google Drive:", file.name);
      console.log("EntityType:", entityType, "EntityId:", entityId);

      // Convert file to base64
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Content = result.split(",")[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log("Arquivo convertido para base64, tamanho:", fileContent.length);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      console.log("Chamando Edge Function google-drive-upload...");

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke("google-drive-upload", {
        body: {
          fileName: file.name,
          fileContent,
          mimeType: file.type,
          entityType,
          entityId,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log("Resposta da Edge Function:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Erro na função de upload");
      }

      if (!data) {
        console.error("Nenhum dado retornado do upload");
        throw new Error("Nenhum dado retornado do upload");
      }

      console.log("Upload realizado com sucesso no Google Drive:", data);

      toast({
        title: "Upload realizado com sucesso",
        description: `Arquivo ${file.name} foi enviado para o Google Drive.`,
      });

      return data;
    } catch (error: any) {
      console.error("Upload error detalhado:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao fazer upload do arquivo.",
        variant: "destructive",
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
    uploadProgress,
  };
};
