
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, FileText, Image } from 'lucide-react';
import { useAttachments } from '@/hooks/useAttachments';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AttachmentListProps {
  entityType: string;
  entityId: string;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ entityType, entityId }) => {
  const { attachments, isLoading, deleteAttachment } = useAttachments(entityType, entityId);
  
  // Temporarily remove role check to test functionality
  const canDelete = true;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') {
      return <FileText className="h-4 w-4" />;
    }
    if (fileType === 'jpg' || fileType === 'jpeg') {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleView = (webViewLink: string) => {
    window.open(webViewLink, '_blank');
  };

  const handleDownload = (downloadLink: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando anexos...</div>;
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Nenhum anexo encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Anexos ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(attachment.file_type)}
                <div>
                  <p className="font-medium text-sm">{attachment.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {attachment.file_type.toUpperCase()}
                    </Badge>
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(attachment.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(attachment.gdrive_view_link)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(attachment.gdrive_download_link, attachment.file_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {canDelete && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remover anexo</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja remover este anexo? Esta ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancelar</Button>
                        <Button
                          onClick={() => deleteAttachment(attachment.id)}
                          variant="destructive"
                        >
                          Remover
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
