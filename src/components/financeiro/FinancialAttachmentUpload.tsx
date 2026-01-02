import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Paperclip, Upload } from "lucide-react";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useUserRole } from "@/hooks/useUserRole";
import { AttachmentUploadData } from "@/types/attachment";

interface FinancialAttachmentUploadProps {
  entityType: string;
  entityId: string;
  onUploadSuccess: (fileData: AttachmentUploadData) => void;
  disabled?: boolean;
}

export const FinancialAttachmentUpload: React.FC<FinancialAttachmentUploadProps> = ({
  entityType,
  entityId,
  onUploadSuccess,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress } = useSupabaseStorage();
  const { hasRole } = useUserRole();

  const canUpload = hasRole("admin") || hasRole("finance");

  const handleFileSelect = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg"];

    if (file.size > maxSize) {
      return "Arquivo muito grande. Máximo permitido: 10MB";
    }

    if (!allowedTypes.includes(file.type)) {
      return "Tipo de arquivo não permitido. Use PDF, JPG ou JPEG";
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      console.error("Validação falhou:", validationError);
      return;
    }

    console.log("FinancialAttachmentUpload - Iniciando upload:", file.name);

    try {
      const result = await uploadFile(file, `financeiro/${entityType}`, entityId);
      if (result) {
        onUploadSuccess({
          file_name: result.fileName,
          file_type: result.mimeType,
          storage_path: result.path,
          storage_url: result.publicUrl,
          file_size: result.size,
        });
      }
    } catch (error) {
      console.error("FinancialAttachmentUpload - Erro no upload:", error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!canUpload) {
    return null;
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg"
        disabled={disabled || isUploading}
      />

      <Button
        type="button"
        onClick={handleFileSelect}
        disabled={disabled || isUploading}
        variant="outline"
        size="sm"
        title="Anexar comprovante"
      >
        {isUploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Paperclip className="mr-2 h-4 w-4" />
            Anexar
          </>
        )}
      </Button>

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-muted-foreground text-center text-xs">{uploadProgress}% enviado</p>
        </div>
      )}
    </div>
  );
};
