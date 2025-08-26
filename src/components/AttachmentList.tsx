
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, FileText, Image, X, File, ExternalLink } from 'lucide-react';
import { useAttachments } from '@/hooks/useAttachments';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface AttachmentListProps {
  entityType: string;
  entityId: string;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({ entityType, entityId }) => {
  const { attachments, isLoading, deleteAttachment } = useAttachments(entityType, entityId);
  const { hasRole } = useUserRole();
  const [imagePreview, setImagePreview] = useState<{ url: string; fileName: string } | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string; useGoogleViewer: boolean } | null>(null);
  
  const canDelete = hasRole('admin') || hasRole('ops');

  // Função para obter URL pública usando Supabase SDK
  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath);
    console.log('AttachmentList - URL pública gerada pelo SDK:', data.publicUrl);
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
    if (mimeType === 'text/plain') {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Imagem';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'text/plain') return 'Texto';
    return 'Arquivo';
  };

  const handlePreview = (attachment: any) => {
    console.log("=== PREVIEW CLICKED ===");
    console.log("AttachmentList - Visualizando anexo:", attachment);
    
    // Usar SDK do Supabase para gerar URL correta
    const publicUrl = getPublicUrl(attachment.storage_path);
    console.log("AttachmentList - URL pública:", publicUrl);
    
    if (attachment.file_type.startsWith('image/')) {
      console.log("AttachmentList - Abrindo imagem em modal");
      setImagePreview({
        url: publicUrl,
        fileName: attachment.file_name
      });
    } else if (attachment.file_type === 'application/pdf') {
      console.log("AttachmentList - Abrindo PDF em modal");
      setPdfPreview({
        url: publicUrl,
        fileName: attachment.file_name,
        useGoogleViewer: false
      });
    } else {
      console.log("AttachmentList - Abrindo arquivo em nova aba");
      window.open(publicUrl, '_blank');
    }
  };

  const handleOpenInNewTab = (storagePath: string) => {
    const publicUrl = getPublicUrl(storagePath);
    console.log("AttachmentList - Abrindo em nova aba com URL:", publicUrl);
    window.open(publicUrl, '_blank');
  };

  const handleDownload = async (attachment: any) => {
    console.log("AttachmentList - Fazendo download do anexo:", attachment);
    
    const publicUrl = getPublicUrl(attachment.storage_path);
    console.log("AttachmentList - URL de download:", publicUrl);
    
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
      console.log("AttachmentList - Download iniciado com sucesso");
    } catch (error) {
      console.error("AttachmentList - Erro ao fazer download:", error);
      // Fallback: tentar abrir em nova aba
      window.open(publicUrl, '_blank');
    }
  };

  const handleIframeError = () => {
    console.log("AttachmentList - Iframe bloqueado, mudando para Google Viewer");
    if (pdfPreview && !pdfPreview.useGoogleViewer) {
      setPdfPreview({
        ...pdfPreview,
        useGoogleViewer: true
      });
    }
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
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
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

                  {attachment.file_type === 'application/pdf' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenInNewTab(attachment.storage_path)}
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {canDelete && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent aria-describedby={undefined}>
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
                            onClick={() => deleteAttachment(attachment)}
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

      {/* Image Preview Modal */}
      {imagePreview && (
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0" aria-describedby={undefined}>
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-medium truncate">
                  {imagePreview.fileName}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="p-6 pt-2">
              <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                <img
                  src={imagePreview.url}
                  alt={imagePreview.fileName}
                  className="max-w-full max-h-[60vh] object-contain rounded"
                  onError={(e) => {
                    console.error('AttachmentList - Erro ao carregar imagem:', imagePreview.url);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyQzIxIDEzLjEwNDYgMjAuMTA0NiAxNCAZIDEzSDdDNS44OTU0MyAxNCA1IDEzLjEwNDYgNSAxMlY3QzUgNS44OTU0MyA1Ljg5NTQzIDUgNyA1SDEyQzEzLjEwNDYgNSAxNCA1Ljg5NTQzIDE0IDdWMTJaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <Dialog open={!!pdfPreview} onOpenChange={() => setPdfPreview(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] p-0" aria-describedby={undefined}>
            <DialogHeader className="p-4 pb-0 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-medium truncate">
                  {pdfPreview.fileName}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const publicUrl = getPublicUrl(pdfPreview.url.includes('attachments/') 
                        ? pdfPreview.url.split('/attachments/')[1] 
                        : pdfPreview.url);
                      window.open(publicUrl, '_blank');
                    }}
                    title="Abrir em nova aba"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Nova aba
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPdfPreview(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-muted rounded-lg overflow-hidden border">
                {pdfPreview.useGoogleViewer ? (
                  <iframe
                    src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfPreview.url)}`}
                    className="w-full h-[75vh]"
                    title={pdfPreview.fileName}
                    frameBorder="0"
                    onLoad={() => {
                      console.log('AttachmentList - PDF carregado com Google Viewer');
                    }}
                  />
                ) : (
                  <iframe
                    src={pdfPreview.url}
                    className="w-full h-[75vh]"
                    title={pdfPreview.fileName}
                    frameBorder="0"
                    onLoad={() => {
                      console.log('AttachmentList - PDF carregado diretamente');
                    }}
                    onError={handleIframeError}
                  />
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm text-muted-foreground">
                  {pdfPreview.useGoogleViewer && "Visualização via Google Viewer. "}
                  Problemas para visualizar? {' '}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open(pdfPreview.url, '_blank')}
                    className="p-0 h-auto text-sm"
                  >
                    Clique aqui para abrir em nova aba
                  </Button>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
