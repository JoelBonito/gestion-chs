
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";

interface AttachmentUploadProps {
  entityType: string;
  entityId: string;
  onUploadSuccess: (result: {
    path: string;
    fullPath: string;
    publicUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }) => void;
  onUploadError?: (error: string) => void;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  entityType,
  entityId,
  onUploadSuccess,
  onUploadError
}) => {
  const { uploadFile, isUploading, uploadProgress } = useSupabaseStorage();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.("Tipo de arquivo não suportado. Use PDF, JPEG ou PNG.");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onUploadError?.("Arquivo muito grande. Tamanho máximo: 10MB.");
      return;
    }

    try {
      const result = await uploadFile(file, entityType, entityId);
      
      if (result) {
        onUploadSuccess(result);
      }
    } catch (error: any) {
      console.error("Erro no upload:", error);
      onUploadError?.(error.message || "Erro ao fazer upload do arquivo");
    } finally {
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [uploadFile, entityType, entityId, onUploadSuccess, onUploadError]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-full border-dashed border-2 h-20 flex flex-col items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-sm">Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <div className="text-center">
                <span className="text-sm font-medium">Clique para anexar arquivo</span>
                <p className="text-xs text-muted-foreground">PDF, JPEG, PNG (max 10MB)</p>
              </div>
            </>
          )}
        </Button>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {uploadProgress}% concluído
          </p>
        </div>
      )}
    </div>
  );
};
