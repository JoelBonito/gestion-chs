
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, FileText, Image, File, ExternalLink } from 'lucide-react';
import { Attachment } from '@/types/attachment';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface FinancialAttachmentPreviewProps {
  attachments: Attachment[];
  onDelete: (attachment: Attachment) => void;
  isLoading?: boolean;
}

export const FinancialAttachmentPreview: React.FC<FinancialAttachmentPreviewProps> = ({
  attachments,
  onDelete,
  isLoading = false
}) => {
  const { hasRole } = useUserRole();
  const [previewModal, setPreviewModal] = useState<{
    type: 'image' | 'pdf';
    url: string;
    fileName: string;
  } | null>(null);
  
  const canDelete = hasRole('admin') || hasRole('finance');

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath);
    return data.publicUrl;
  };

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
    if (mimeType === 'application/pdf') {
      return <File className="w-4 h-4 text-red-500" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Imagem';
    if (mimeType === 'application/pdf') return 'PDF';
    return 'Arquivo';
  };

  const handlePreview = (attachment: Attachment) => {
    console.log("FinancialAttachmentPreview - Visualizando:", attachment);
    
    const publicUrl = getPublicUrl(attachment.storage_path);
    
    if (attachment.file_type?.startsWith('image/')) {
      setPreviewModal({
        type: 'image',
        url: publicUrl,
        fileName: attachment.file_name
      });
    } else if (attachment.file_type === 'application/pdf') {
      setPreviewModal({
        type: 'pdf',
        url: publicUrl,
        fileName: attachment.file_name
      });
    } else {
      window.open(publicUrl, '_blank');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    const publicUrl = getPublicUrl(attachment.storage_path);
    
    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      window.open(publicUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-16" />
        ))}
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum comprovante anexado</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(attachment.file_type)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.file_name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {getFileTypeLabel(attachment.file_type)}
                  </Badge>
                  <span>{formatFileSize(attachment.file_size)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(attachment)}
                title="Visualizar"
              >
                <Eye className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(getPublicUrl(attachment.storage_path), '_blank')}
                title="Abrir em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>

              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(attachment)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <Dialog open={!!previewModal} onOpenChange={() => setPreviewModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-0 border-b">
              <DialogTitle className="text-lg font-medium truncate">
                {previewModal.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-muted rounded-lg overflow-hidden border">
                {previewModal.type === 'image' ? (
                  <img
                    src={previewModal.url}
                    alt={previewModal.fileName}
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem');
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDEzLjEwNDYgMjAuMTA0NiAxNCA5IDE0SDdDNS44OTU0MyAxNCA1IDEzLjEwNDYgNSAxMlY3QzUgNS44OTU0MyA1Ljg5NTQzIDUgNyA1SDEyQzEzLjEwNDYgNSAxNCA1Ljg5NTQzIDE0IDdWMTJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                    }}
                  />
                ) : (
                  <iframe
                    src={previewModal.url}
                    className="w-full h-[75vh]"
                    title={previewModal.fileName}
                    frameBorder="0"
                    onLoad={() => console.log('PDF carregado com sucesso')}
                    onError={() => console.log('Erro ao carregar PDF')}
                  />
                )}
              </div>
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewModal.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir em nova aba
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
