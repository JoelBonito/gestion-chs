
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, FileText, Image } from 'lucide-react';
import { useAttachments } from '@/hooks/useAttachments';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AttachmentListProps {
  entityType: string;
  entityId: string;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ entityType, entityId }) => {
  const { attachments, isLoading, deleteAttachment } = useAttachments(entityType, entityId);
  const { hasRole } = useUserRole();
  
  const canDelete = hasRole('admin') || hasRole('ops');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Imagem';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Planilha';
    return 'Arquivo';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum anexo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(attachment.mime_type)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file_name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {getFileTypeLabel(attachment.mime_type)}
                    </Badge>
                    <span>{formatFileSize(attachment.file_size)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {attachment.google_drive_link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={attachment.google_drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </Button>
                )}

                {attachment.google_drive_download_link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={attachment.google_drive_download_link} 
                      download
                      className="flex items-center"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}

                {canDelete && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Excluir anexo</DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja excluir o arquivo "{attachment.file_name}"? 
                          Esta ação não pode ser desfeita.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancelar</Button>
                        <Button 
                          variant="destructive"
                          onClick={() => deleteAttachment(attachment.id)}
                        >
                          Excluir
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
