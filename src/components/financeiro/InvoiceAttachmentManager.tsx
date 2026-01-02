import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Upload, FileText, Eye, Download, Trash2, ExternalLink } from "lucide-react";
import { Invoice } from "@/types/invoice";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface InvoiceAttachmentManagerProps {
  invoice: Invoice;
  onUpdate: () => void;
}

export const InvoiceAttachmentManager: React.FC<InvoiceAttachmentManagerProps> = ({
  invoice,
  onUpdate,
}) => {
  const { user } = useAuth();
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";

  // i18n
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      Anexos: { pt: "Anexos", fr: "Pièces jointes" },
      "Envio de Documentos": { pt: "Envio de Documentos", fr: "Envoi de documents" },
      "Selecione um arquivo PDF para anexar a esta fatura.": {
        pt: "Selecione um arquivo PDF para anexar a esta fatura.",
        fr: "Sélectionnez un fichier PDF à joindre à cette facture.",
      },
      "Somente arquivos PDF até 10MB": {
        pt: "Somente arquivos PDF até 10MB",
        fr: "Uniquement les fichiers PDF jusqu'à 10 Mo",
      },
      "Enviando...": { pt: "Enviando...", fr: "Envoi en cours..." },
      "Enviar Anexo": { pt: "Enviar Anexo", fr: "Envoyer la pièce jointe" },
      Cancelar: { pt: "Cancelar", fr: "Annuler" },
      "Abrir em nova aba": { pt: "Abrir em nova aba", fr: "Ouvrir dans un nouvel onglet" },
      Documento: { pt: "Documento", fr: "Document" },
      Visualizar: { pt: "Visualizar", fr: "Visualiser" },
      Download: { pt: "Download", fr: "Télécharger" },
      Excluir: { pt: "Excluir", fr: "Supprimer" },
      "Apenas arquivos PDF são permitidos.": {
        pt: "Apenas arquivos PDF são permitidos.",
        fr: "Seuls les fichiers PDF sont autorisés.",
      },
      "Arquivo muito grande. Máximo permitido: 10MB": {
        pt: "Arquivo muito grande. Máximo permitido: 10MB",
        fr: "Fichier trop volumineux. Maximum autorisé : 10 Mo",
      },
      "Erro ao deletar anexo": {
        pt: "Erro ao deletar anexo",
        fr: "Erreur lors de la suppression de la pièce jointe",
      },
      "Anexo deletado com sucesso": {
        pt: "Anexo deletado com sucesso",
        fr: "Pièce jointe supprimée avec succès",
      },
      "Confirmar Exclusão": { pt: "Confirmar Exclusão", fr: "Confirmer la suppression" },
      "Tem certeza que deseja excluir este anexo?": {
        pt: "Tem certeza que deseja excluir este anexo?",
        fr: "Êtes-vous sûr de vouloir supprimer cette pièce jointe ?",
      },
      "Anexo adicionado com sucesso!": {
        pt: "Anexo adicionado com sucesso!",
        fr: "Pièce jointe ajoutée avec succès !",
      },
      "Nenhum anexo encontrado": {
        pt: "Nenhum anexo encontrado",
        fr: "Aucune pièce jointe trouvée",
      },
    };
    return d[k]?.[lang] || k;
  };
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  const { uploadFile, isUploading } = useSupabaseStorage();
  const { canEdit } = useUserRole();
  const canManage = canEdit();

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert(t("Apenas arquivos PDF são permitidos."));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      alert(t("Arquivo muito grande. Máximo permitido: 10MB"));
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      console.log("InvoiceAttachmentManager - Iniciando upload");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const date = new Date(invoice.invoice_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const result = await uploadFile(
        selectedFile,
        `faturas/${year}/${month}`,
        `invoice-${invoice.id}-${Date.now()}`
      );

      if (!result) {
        throw new Error("Erro no upload do arquivo");
      }

      console.log("InvoiceAttachmentManager - Upload concluído, criando anexo");

      // Criar registro na tabela attachments
      const { data: attachment, error: attachmentError } = await supabase
        .from("attachments")
        .insert([
          {
            entity_type: "invoice",
            entity_id: invoice.id,
            file_name: result.fileName,
            file_type: result.mimeType,
            storage_path: result.path,
            storage_url: result.publicUrl,
            file_size: result.size,
            uploaded_by: user.id,
          },
        ])
        .select()
        .single();

      if (attachmentError) {
        console.error("Erro ao criar attachment:", attachmentError);
        throw attachmentError;
      }

      console.log("InvoiceAttachmentManager - Anexo criado, atualizando fatura");

      // Atualizar a fatura com o attachment_id
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ attachment_id: attachment.id })
        .eq("id", invoice.id);

      if (updateError) {
        console.error("Erro ao atualizar fatura:", updateError);
        throw updateError;
      }

      toast.success(t("Anexo adicionado com sucesso!"));
      setSelectedFile(null);
      setIsUploadOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error(error.message || t("Erro ao fazer upload"));
    }
  };

  const handleDelete = async () => {
    if (!invoice.attachment || !canManage) return;

    if (!confirm(t("Tem certeza que deseja excluir este anexo?"))) {
      return;
    }

    try {
      console.log("InvoiceAttachmentManager - Removendo anexo");

      // Remover da storage
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([invoice.attachment.storage_path]);

      if (storageError) {
        console.error("Erro ao remover da storage:", storageError);
      }

      // Remover da tabela attachments
      const { error: deleteError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", invoice.attachment.id);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar a fatura removendo o attachment_id
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ attachment_id: null })
        .eq("id", invoice.id);

      if (updateError) {
        throw updateError;
      }

      toast.success(t("Anexo deletado com sucesso"));
      onUpdate();
    } catch (error: any) {
      console.error("Erro ao remover anexo:", error);
      toast.error(t("Erro ao deletar anexo"));
    }
  };

  const handlePreview = () => {
    if (!invoice.attachment) return;

    const publicUrl = getPublicUrl(invoice.attachment.storage_path);
    setPreviewModal({
      url: publicUrl,
      fileName: invoice.attachment.file_name,
    });
  };

  const handleDownload = async () => {
    if (!invoice.attachment) return;

    const publicUrl = getPublicUrl(invoice.attachment.storage_path);

    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = invoice.attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      window.open(publicUrl, "_blank");
    }
  };

  return (
    <>
      <Card className="bg-card border-border/30 mt-4 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <Paperclip className="text-primary h-4 w-4" />
            {t("Anexos")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.attachment ? (
            <div className="flex flex-col gap-3">
              <div className="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-5 w-5 shrink-0 text-red-500" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-semibold">
                      {invoice.attachment.file_name}
                    </span>
                    <span className="text-muted-foreground text-[10px] uppercase">
                      {t("Documento")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPreviewModal({
                        url: getPublicUrl(invoice.attachment!.storage_path),
                        fileName: invoice.attachment!.file_name,
                      })
                    }
                    title={t("Visualizar")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(getPublicUrl(invoice.attachment!.storage_path), "_blank")
                    }
                    title={t("Download")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-red-600"
                      onClick={handleDelete}
                      title={t("Excluir")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-border/50 rounded-xl border-2 border-dashed px-4 py-6 text-center">
              <Paperclip className="text-muted-foreground/30 mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm italic">{t("Nenhum anexo encontrado")}</p>
              {canManage && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Upload className="mr-2 h-4 w-4" />
                      {t("Enviar Anexo")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-popover border-border/50 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Upload className="text-primary h-5 w-5" />
                        {t("Envio de Documentos")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid w-full items-center gap-2">
                        <Label
                          htmlFor="file-upload"
                          className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                        >
                          {t("Selecione um arquivo PDF para anexar a esta fatura.")}
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="bg-background/50 border-border/40"
                        />
                        <p className="text-muted-foreground text-[10px] italic">
                          {t("Somente arquivos PDF até 10MB")}
                        </p>
                      </div>

                      {selectedFile && (
                        <div className="bg-muted/30 rounded-lg p-3">
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
                              <Upload className="mr-2 h-4 w-4 animate-spin" />
                              {t("Enviando...")}
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              {t("Enviar Anexo")}
                            </>
                          )}
                        </Button>
                        <Button variant="cancel" onClick={() => setIsUploadOpen(false)}>
                          {t("Cancelar")}
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
          <DialogContent className="bg-accent border-border/50 max-h-[90vh] max-w-4xl p-0">
            <DialogHeader className="border-b p-4 pb-0">
              <DialogTitle className="truncate text-lg font-medium">
                {previewModal.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-muted overflow-hidden rounded-lg border">
                <iframe
                  src={previewModal.url}
                  className="h-[75vh] w-full"
                  title={previewModal.fileName}
                  frameBorder="0"
                />
              </div>
              <div className="mt-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewModal.url, "_blank")}
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
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
