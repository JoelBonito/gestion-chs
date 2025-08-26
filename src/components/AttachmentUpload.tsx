
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, Upload } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useUserRole } from '@/hooks/useUserRole';

interface AttachmentUploadProps {
  entityType?: string;
  entityId?: string;
  onUploadSuccess: (fileData: {
    file_name: string;
    file_type: string;
    gdrive_file_id: string;
    gdrive_view_link: string;
    gdrive_download_link: string;
    file_size: number;
  }) => void;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({ 
  entityType, 
  entityId, 
  onUploadSuccess 
}) => {
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

    console.log('Iniciando upload do arquivo:', file.name, 'para entidade:', entityType, entityId);

    try {
      const result = await uploadFile(file, entityType, entityId);
      if (result) {
        // Transform the GoogleDriveUploadResult to match the expected interface
        onUploadSuccess({
          file_name: result.name,
          file_type: result.mimeType,
          gdrive_file_id: result.fileId,
          gdrive_view_link: result.webViewLink,
          gdrive_download_link: result.downloadLink,
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

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple={false}
      />
      
      <Button 
        onClick={handleFileSelect}
        disabled={isUploading}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isUploading ? (
          <>
            <Upload className="w-4 h-4 mr-2 animate-spin" />
            Enviando para Google Drive...
          </>
        ) : (
          <>
            <Paperclip className="w-4 h-4 mr-2" />
            Anexar Arquivo
          </>
        )}
      </Button>

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress}% enviado para Google Drive
          </p>
        </div>
      )}
    </div>
  );
};
