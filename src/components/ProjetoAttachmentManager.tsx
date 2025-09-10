import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, FileText, Eye, Download, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface ProjetoAttachmentManagerProps {
  projetoId: string;
  onUpdate?: () => void; // ← Callback adicionado
}

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
}

export const ProjetoAttachmentManager: React.FC<ProjetoAttachmentManagerProps> = ({ 
  projetoId, 
  onUpdate 
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewModal, setPreviewModal] = useState<{ url: string; fileName: string } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { uploadFile, isUploading } = useSupabaseStorage();
  const { hasRole } = useUserRole();
  
  const canManage = hasRole('admin');

  const fetchAttachments = async () => {
    if (!projetoId) return;
    
    setIsLoading(true);
    try {
      console.log('ProjetoAttachmentManager - Carregando anexos para projeto:', projetoId);
      
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'projeto')
        .eq('entity_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao carregar anexos:", error);
        toast.error("Erro ao carregar anexos");
        return;
      }

      console.log('ProjetoAttachmentManager - Anexos carregados:', data?.length || 0);
      setAttachments(data || []);
    } catch (error) {
      console.error("Erro inesperado ao carregar anexos:", error);
      toast.error("Erro inesperado ao carregar anexos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projetoId) {
      fetchAttachments();
    }
  }, [projetoId]);

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
      console.log('ProjetoAttachmentManager - Iniciando upload para projeto:', projetoId);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const result = await uploadFile(
        selectedFile, 
        `projetos/${projetoId}`,
        `projeto-${projetoId}-${Date.now()}`
      );

      if (!result) {
        throw new Error("Erro no upload do arquivo");
      }

      console.log('ProjetoAttachmentManager - Upload concluído, criando anexo');

      // Criar registro na tabela attachments
      const { data: attachment, error: attachmentError } = await supabase
        .from('attachments')
        .insert([{
          entity_type: 'projeto',
          entity_id: projetoId,
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

      console.log('ProjetoAttachmentManager - Anexo criado com sucesso:', attachment);

      toast.success('Anexo adicionado ao projeto!');
      setSelectedFile(null);
      setIsUploadOpen(false);
      
      // Refetch local dos anexos
      await fetchAttachments();
      
      // Chamar callback para atualizar componente pai
      if (onUpdate) {
        console.log('ProjetoAttachmentManager - Executando callback onUpdate');
        onUpdate();
      }

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro ao adicionar anexo: ${error.message}`);
    }
  };

  const handleRemoveAttachment = async (attachment: Attachment) => {
    if (!canManage) return;

    if (!confirm('Tem certeza que deseja remover este anexo?')) {
      return;
    }

    try {
      console.log('ProjetoAttachmentManager - Removendo anexo:', attachment.id);

      // Remover da storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.storage_path]);

      if (storageError) {
        console.error("Erro ao remover da storage:", storageError);
      }

      // Remover da tabela attachments
      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (deleteError) {
        throw deleteError;
      }

      toast.success('Anexo removido com sucesso!');
      
      // Refetch local dos anexos
      await fetchAttachments();
      
      // Chamar callback para atualizar componente pai
      if (onUpdate) {
        console.log('ProjetoAttachmentManager - Executando callback onUpdate após remoção');
        onUpdate();
      }

    } catch (error: any) {
      console.error('Erro ao remover anexo:', error);
      toast.error(`Erro ao remover anexo: ${error.message}`);
    }
  };

  const handlePreview = (attachment: Attachment) => {
    const publicUrl = getPublicUrl(attachment.storage_path);
    setPreviewModal({
      url: publicUrl,
      fileName: attachment.file_name
    });
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

  if (!projetoId) {
    console.log('ProjetoAttachmentManager - ProjetoId não fornecido');
    return null;
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexos do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Carregando anexos...</p>
            </div>
          ) : attachments.length > 0 ? (
            <div className="space-y-3">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">{att.file_name}</p>
                      <p className="text-xs text-muted-foreground">PDF</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handlePreview(att)} title="Visualizar">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open(getPublicUrl(att.storage_path), '_blank')}
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(att)} title="Download">
                      <Download className="w-4 h-4" />
                    </Button>
                    {canManage && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAttachment(att)}
                        title="Remover anexo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Botão para adicionar mais anexos quando já existem */}
              {canManage && (
                <div className="pt-3 border-t">
                  <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Adicionar Mais Anexos
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Anexo ao Projeto</DialogTitle>
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
                            className="flex-1"
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
                          <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum anexo encontrado</p>
              {canManage && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Adicionar Anexo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Anexo ao Projeto</DialogTitle>
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
                          className="flex-1"
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
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
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
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
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
