import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupabaseUploadResult {
  path: string;
  fullPath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}

// Function to sanitize filename for Supabase Storage
const sanitizeFileName = (fileName: string): string => {
  // Get file extension
  const lastDotIndex = fileName.lastIndexOf(".");
  const name = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;
  const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : "";

  // Normalize characters with accents and remove special characters
  const sanitizedName = name
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/[^a-zA-Z0-9\-_]/g, "_") // Replace non-alphanumeric chars with underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

  return sanitizedName + extension;
};

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
      console.log("Iniciando upload para Supabase Storage:", {
        originalFileName: file.name,
        size: file.size,
        type: file.type,
        entityType,
        entityId,
      });

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      // Sanitize filename to avoid invalid key errors
      const originalFileName = file.name;
      const sanitizedFileName = sanitizeFileName(originalFileName);

      console.log("Nome do arquivo sanitizado:", {
        original: originalFileName,
        sanitized: sanitizedFileName,
      });

      // Create file path with user ID and timestamp to avoid conflicts
      const timestamp = Date.now();
      const fileName = `${timestamp}-${sanitizedFileName}`;
      const filePath = `${user.id}/${entityType || "general"}/${fileName}`;

      console.log("Caminho final do arquivo:", filePath);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Upload file to Supabase Storage with explicit contentType
      const { data, error } = await supabase.storage.from("attachments").upload(filePath, file, {
        contentType: file.type, // Garantir content-type correto
        upsert: false,
      });

      clearInterval(progressInterval);

      if (error) {
        console.error("Erro no upload do Storage:", error);
        throw error;
      }

      console.log("Upload bem-sucedido no Storage:", data);

      // Get public URL usando SDK oficial
      const { data: publicUrlData } = supabase.storage.from("attachments").getPublicUrl(filePath);

      setUploadProgress(100);

      const result: SupabaseUploadResult = {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrlData.publicUrl,
        fileName: originalFileName, // Keep original name for display
        mimeType: file.type,
        size: file.size,
      };

      console.log("Resultado final do upload:", result);

      toast({
        title: "Upload concluído",
        description: `Arquivo "${originalFileName}" enviado com sucesso.`,
      });

      return result;
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload do arquivo.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      const { error } = await supabase.storage.from("attachments").remove([filePath]);

      if (error) {
        console.error("Erro ao deletar arquivo:", error);
        throw error;
      }

      console.log("Arquivo deletado com sucesso:", filePath);
    } catch (error: any) {
      console.error("Erro ao deletar arquivo:", error);
      toast({
        title: "Erro ao deletar",
        description: error.message || "Erro ao deletar arquivo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress,
  };
};
