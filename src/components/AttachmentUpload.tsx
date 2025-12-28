
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, Upload } from 'lucide-react';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsCollaborator } from '@/hooks/useIsCollaborator';

interface AttachmentUploadProps {
  entityType?: string;
  entityId?: string;
  onUploadSuccess: (fileData: {
    file_name: string;
    file_type: string;
    storage_path: string;
    storage_url: string;
    file_size: number;
  }) => void;
  compact?: boolean;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  entityType,
  entityId,
  onUploadSuccess,
  compact = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress } = useSupabaseStorage();
  const { hasRole, isHardcodedAdmin } = useUserRole();
  const { isCollaborator } = useIsCollaborator();

  // Check if user can upload files
  const canUpload = isHardcodedAdmin || hasRole('admin') || hasRole('ops') || hasRole('factory') || hasRole('finance') || isCollaborator;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Iniciando upload do arquivo:', file.name, 'para entidade:', entityType, entityId);

    try {
      const result = await uploadFile(file, entityType, entityId);
      if (result) {
        // Transform the SupabaseUploadResult to match the expected interface
        onUploadSuccess({
          file_name: result.fileName,
          file_type: result.mimeType,
          storage_path: result.path,
          storage_url: result.publicUrl,
          file_size: result.size
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!canUpload) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          multiple={false}
        />

        <Button
          type="button"
          onClick={handleFileSelect}
          disabled={isUploading}
          size="sm"
          variant="gradient"
          className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider active:scale-95 transition-all shadow-sm"
        >
          {isUploading ? (
            <>
              <Upload className="h-3 w-3 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Paperclip className="h-3 w-3" />
              <span>Adicionar</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        multiple={false}
      />

      <Button
        type="button"
        onClick={handleFileSelect}
        disabled={isUploading}
        size="md"
        variant="gradient"
        className="px-6 h-9 text-xs uppercase font-bold tracking-widest active:scale-95 transition-all shadow-md"
      >
        {isUploading ? (
          <>
            <Upload className="w-4 h-4 mr-2 animate-spin" />
            <span>Enviando...</span>
          </>
        ) : (
          <>
            <Paperclip className="w-4 h-4 mr-2" />
            <span>Anexar Arquivo</span>
          </>
        )}
      </Button>

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress}% enviado
          </p>
        </div>
      )}
    </div>
  );
};
