import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, FileText, Image, File, ExternalLink, X } from 'lucide-react';
import { useAttachments } from '@/hooks/useAttachments';
import { useTransporteAttachments } from '@/hooks/useTransporteAttachments';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface AttachmentListProps {
  entityType: string;
  entityId: string;
  onChanged?: () => void;
  compact?: boolean;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ 
  entityType, 
  entityId, 
  onChanged,
  compact = false 
}) => {
  const isTransporte = entityType === 'transporte';
  const genericAttachments = useAttachments(entityType, entityId);
  const transporteAttachments = useTransporteAttachments(isTransporte ? entityId : '');
  
  // Use the appropriate hook based on entity type
  const { attachments, isLoading, deleteAttachment } = isTransporte ? transporteAttachments : genericAttachments;
  
  const { hasRole, isHardcodedAdmin } = useUserRole();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Check if user can delete files
  const canDelete = isHardcodedAdmin || hasRole('admin') || hasRole('ops') || hasRole('factory') || hasRole('finance');

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (fileType?.includes('pdf')) {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Tamanho desconhecido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadFile = async (attachment: any) => {
    try {
      console.log("Downloading attachment:", attachment);
      
      let fileUrl: string;
      if (isTransporte) {
        fileUrl = attachment.url;
      } else {
        fileUrl = attachment.storage_url;
      }
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = isTransporte ? attachment.name : attachment.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getPublicUrl = async (storagePath: string) => {
    try {
      const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(storagePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return null;
    }
  };

  const handlePreview = async (attachment: any) => {
    console.log("Preview attachment:", attachment);
    
    try {
      let fileUrl: string;
      let fileName: string;
      let fileType: string;
      
      if (isTransporte) {
        fileUrl = attachment.url;
        fileName = attachment.name;
        fileType = attachment.file_type;
      } else {
        fileUrl = attachment.storage_url;
        fileName = attachment.file_name;
        fileType = attachment.file_type;
      }
      
      // Para PDFs, abrir em nova aba em vez de modal
      if (fileType?.includes('pdf')) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      
      setPreviewUrl(fileUrl);
      setPreviewType(fileType);
      setPreviewTitle(fileName);
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const handleDelete = async (attachment: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este anexo?')) {
      return;
    }

    try {
      await deleteAttachment(attachment);
      if (onChanged) onChanged();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    if (previewType?.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img 
            src={previewUrl} 
            alt={previewTitle}
            className="max-w-full max-h-96 object-contain"
          />
        </div>
      );
    } else if (previewType?.includes('pdf')) {
      // PDFs agora abrem em nova aba, mas mantemos este código para casos especiais
      return (
        <div className="text-center p-8">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>PDF será aberto em nova aba.</p>
          <Button 
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            className="mt-4"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir PDF
          </Button>
        </div>
      );
    } else {
      return (
        <div className="text-center p-8">
          <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Prévia não disponível para este tipo de arquivo.</p>
          <Button 
            onClick={() => downloadFile({ [isTransporte ? 'url' : 'storage_url']: previewUrl, [isTransporte ? 'name' : 'file_name']: previewTitle })}
            className="mt-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Arquivo
          </Button>
        </div>
      );
    }
  };

  if (isLoading) {
    return compact ? null : (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return compact ? null : (
      <div className="text-center p-4 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum anexo encontrado</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {attachments.slice(0, 2).map((attachment) => (
          <Button
            key={attachment.id}
            variant="ghost"
            size="icon"
            onClick={() => handlePreview(attachment)}
            title={isTransporte ? attachment.name : attachment.file_name}
            className="h-8 w-8"
          >
            {getFileIcon(attachment.file_type)}
          </Button>
        ))}
        {attachments.length > 2 && (
          <Badge variant="secondary" className="text-xs px-1">
            +{attachments.length - 2}
          </Badge>
        )}
        
        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" aria-describedby="">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{previewTitle}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewUrl(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            {renderPreviewContent()}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Anexos ({attachments.length})</h3>
      
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(attachment.file_type)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {isTransporte ? attachment.name : attachment.file_name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  <span>•</span>
                  <span>{new Date(attachment.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePreview(attachment)}
                title="Visualizar"
                className="h-8 w-8"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => downloadFile(attachment)}
                title="Baixar"
                className="h-8 w-8"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(attachment)}
                  title="Excluir"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" aria-describedby="">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewTitle}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {renderPreviewContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};