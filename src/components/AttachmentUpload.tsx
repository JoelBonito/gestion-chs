
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, Upload } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useUserRole } from '@/hooks/useUserRole';

interface AttachmentUploadProps {
  onUploadSuccess: (fileData: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    webViewLink: string;
    webContentLink: string;
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
        onUploadSuccess(result);
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
            Enviando...
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
            {uploadProgress}% enviado
          </p>
        </div>
      )}
    </div>
  );
};
