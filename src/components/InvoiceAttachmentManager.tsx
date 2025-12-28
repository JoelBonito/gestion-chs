import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, FileText, Eye, Download, Trash2, ExternalLink } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvoiceAttachmentManagerProps {
  invoice: Invoice;
  onUpdate: () => void;
}

export const InvoiceAttachmentManager: React.FC<InvoiceAttachmentManagerProps> = ({
  invoice,
  onUpdate
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  const { uploadFile, isUploading } = useSupabaseStorage();
  const { hasRole } = useUserRole();

  const canManage = hasRole('admin') || hasRole('finance');

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Arquivo muito grande. Máximo permitido: 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      console.log('InvoiceAttachmentManager - Iniciando upload');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const date = new Date(invoice.invoice_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      const result = await uploadFile(
        selectedFile,
        `faturas/${year}/${month}`,
        `invoice-${invoice.id}-${Date.now()}`
      );

      if (!result) {
        throw new Error("Erro no upload do arquivo");
      }

      console.log('InvoiceAttachmentManager - Upload concluído, criando anexo');

      // Criar registro na tabela attachments
      const { data: attachment, error: attachmentError } = await supabase
        .from('attachments')
        .insert([{
          entity_type: 'invoice',
          entity_id: invoice.id,
          file_name: result.fileName,
          file_type: result.mimeType,
          storage_path: result.path,
          storage_url: result.publicUrl,
          file_size: result.size,
          uploaded_by: user.id
        }])
        .select()
        .single();

      if (attachmentError) {
        console.error("Erro ao criar attachment:", attachmentError);
        throw attachmentError;
      }

      console.log('InvoiceAttachmentManager - Anexo criado, atualizando fatura');

      // Atualizar a fatura com o attachment_id
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ attachment_id: attachment.id })
        .eq('id', invoice.id);

      if (updateError) {
        console.error("Erro ao atualizar fatura:", updateError);
        throw updateError;
      }

      toast.success('Anexo adicionado com sucesso!');
      setSelectedFile(null);
      setIsUploadOpen(false);
      onUpdate();

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro ao adicionar anexo: ${error.message}`);
    }
  };

  const handleRemoveAttachment = async () => {
    if (!invoice.attachment || !canManage) return;

    if (!confirm('Tem certeza que deseja remover este anexo?')) {
      return;
    }

    try {
      console.log('InvoiceAttachmentManager - Removendo anexo');

      // Remover da storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([invoice.attachment.storage_path]);

      if (storageError) {
        console.error("Erro ao remover da storage:", storageError);
      }

      // Remover da tabela attachments
      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', invoice.attachment.id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar a fatura removendo o attachment_id
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ attachment_id: null })
        .eq('id', invoice.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Anexo removido com sucesso!');
      onUpdate();

    } catch (error: any) {
      console.error('Erro ao remover anexo:', error);
      toast.error(`Erro ao remover anexo: ${error.message}`);
    }
  };

  const handlePreview = () => {
    if (!invoice.attachment) return;

    const publicUrl = getPublicUrl(invoice.attachment.storage_path);
    setPreviewModal({
      url: publicUrl,
      fileName: invoice.attachment.file_name
    });
  };

  const handleDownload = async () => {
    if (!invoice.attachment) return;

    const publicUrl = getPublicUrl(invoice.attachment.storage_path);

    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = invoice.attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      window.open(publicUrl, '_blank');
    }
  };

  return (
    <>
      <Card className="mt-4 bg-card border-border/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexo da Fatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.attachment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-popover rounded-lg border border-border/20 shadow-sm transition-all hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">{invoice.attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      PDF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreview}
                    title="Visualizar"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getPublicUrl(invoice.attachment!.storage_path), '_blank')}
                    title="Abrir em nova aba"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 active:scale-90 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    title="Download"
                    className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 hover:scale-110 active:scale-90 transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAttachment}
                      title="Remover anexo"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:scale-110 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Esta fatura não possui anexo</p>
              {canManage && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Adicionar Anexo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border/50">
                    <DialogHeader>
                      <DialogTitle>Adicionar Anexo à Fatura</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="attachment_file">Arquivo PDF</Label>
                        <Input
                          id="attachment_file"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Apenas arquivos PDF até 10MB são permitidos.
                        </p>
                      </div>

                      {selectedFile && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            <span className="text-sm">{selectedFile.name}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpload}
                          disabled={!selectedFile || isUploading}
                          variant="gradient"
                          className="w-full"
                        >
                          {isUploading ? (
                            <>
                              <Upload className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Enviar Anexo
                            </>
                          )}
                        </Button>
                        <Button variant="cancel" onClick={() => setIsUploadOpen(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewModal && (
        <Dialog open={!!previewModal} onOpenChange={() => setPreviewModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-accent border-border/50">
            <DialogHeader className="p-4 pb-0 border-b">
              <DialogTitle className="text-lg font-medium truncate">
                {previewModal.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-muted rounded-lg overflow-hidden border">
                <iframe
                  src={previewModal.url}
                  className="w-full h-[75vh]"
                  title={previewModal.fileName}
                  frameBorder="0"
                />
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