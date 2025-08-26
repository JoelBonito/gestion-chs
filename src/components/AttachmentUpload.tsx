
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, Upload } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useUserRole } from '@/hooks/useUserRole';

interface AttachmentUploadProps {
  onUploadSuccess: (fileData: {
    gdrive_file_id: string;
    name: string;
    mime_type: string;
    web_view_link: string;
    file_size: number;
  }) => void;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress } = useGoogleDrive();
  const { hasRole } = useUserRole();
  
  // Check if user can upload files
  const canUpload = hasRole('admin') || hasRole('ops');

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      if (result) {
        onUploadSuccess({
          gdrive_file_id: result.fileId,
          name: result.name,
          mime_type: result.mimeType,
          web_view_link: result.webViewLink,
          file_size: result.size
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!canUpload) {
    return null;
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button
        onClick={handleFileSelect}
        disabled={isUploading}
        variant="outline"
        className="w-full"
      >
        {isUploading ? (
          <Upload className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="mr-2 h-4 w-4" />
        )}
        {isUploading ? 'Enviando...' : 'Anexar Arquivo'}
      </Button>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            {uploadProgress}% enviado
          </p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Apenas arquivos PDF e JPG. Máximo 10MB.
      </p>
    </div>
  );
};
