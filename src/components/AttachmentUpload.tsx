
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, Upload } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';

interface AttachmentUploadProps {
  onUploadSuccess: (fileData: {
    file_name: string;
    file_type: string;
    gdrive_file_id: string;
    gdrive_view_link: string;
    gdrive_download_link: string;
    file_size: number;
  }) => void;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress } = useGoogleDrive();
  
  // Temporarily remove role check to test functionality
  const canUpload = true;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      if (result) {
        // Extract file type from mime type
        const fileType = result.mimeType === 'application/pdf' ? 'pdf' : 
                         result.mimeType === 'image/jpeg' ? 'jpg' : 'jpeg';
        
        onUploadSuccess({
          file_name: result.name,
          file_type: fileType,
          gdrive_file_id: result.fileId,
          gdrive_view_link: result.webViewLink,
          gdrive_download_link: result.downloadLink,
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
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Upload de arquivos temporariamente disponível para teste. Configure as permissões do Google Drive.
        </p>
      </div>
    );
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
