import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, Download, Edit, Trash2, FileText, ExternalLink, Paperclip, Plus, Check, X, Pencil, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Invoice, InvoiceFormData } from "@/types/invoice";
import { EditInvoiceTabs } from "./EditInvoiceTabs";
import { EmitirFaturaPanel, type EmitirFaturaInitialData } from "@/components/fatura/EmitirFaturaPanel";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceAttachmentManager } from "./InvoiceAttachmentManager";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useLocale } from "@/contexts/LocaleContext";
import { useInvoicesTranslation } from "@/hooks/useInvoicesTranslation";

interface InvoiceListProps {
  invoices: Invoice[];
  onUpdate: (
    id: string,
    data: Partial<InvoiceFormData>,
    currentInvoice?: Invoice
  ) => Promise<unknown> | void;
  onCreate?: (data: InvoiceFormData) => Promise<unknown>;
  onDelete: (invoice: Invoice) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  onAddNew?: () => void;
  isUpdating?: boolean;
  isCreating?: boolean;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onUpdate,
  onCreate,
  onDelete,
  onRefresh,
  isLoading = false,
  onAddNew,
  isUpdating = false,
  isCreating = false,
}) => {
  const { hasRole } = useUserRole();
  const { user } = useAuth();
  const { locale } = useLocale();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editMode, setEditMode] = useState<"editar" | "emitir">("editar");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string>("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [duplicateInitialData, setDuplicateInitialData] = useState<EmitirFaturaInitialData | null>(null);
  const [loadingDuplicate, setLoadingDuplicate] = useState(false);

  const handleDuplicate = async (invoice: Invoice) => {
    if (!invoice.fatura_emitida_id) return;
    setLoadingDuplicate(true);
    try {
      const { data, error } = await supabase
        .from("faturas_emitidas")
        .select("cliente_id, linhas, condicoes_pagamento, moeda")
        .eq("id", invoice.fatura_emitida_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("Fatura emitida original não encontrada.");
        return;
      }
      const linhas = Array.isArray(data.linhas) ? (data.linhas as EmitirFaturaInitialData["linhas"]) : [];
      setDuplicateInitialData({
        cliente_id: data.cliente_id,
        linhas,
        descricao_extra: invoice.description ?? "",
        condicoes_pagamento: data.condicoes_pagamento ?? "Pronto Pagamento",
        moeda: data.moeda ?? "Euro",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao carregar dados para duplicação: ${msg}`);
    } finally {
      setLoadingDuplicate(false);
    }
  };

  const startEditDescription = (invoice: Invoice) => {
    setEditingDescriptionId(invoice.id);
    setDescriptionDraft(invoice.description ?? "");
  };

  const cancelEditDescription = () => {
    setEditingDescriptionId(null);
    setDescriptionDraft("");
  };

  const saveDescription = async (invoice: Invoice) => {
    const next = descriptionDraft.trim();
    if (next === (invoice.description ?? "")) {
      cancelEditDescription();
      return;
    }
    setSavingDescription(true);
    try {
      await onUpdate(invoice.id, { description: next }, invoice);
      cancelEditDescription();
    } catch {
      // toast já exibido pelo hook
    } finally {
      setSavingDescription(false);
    }
  };

  const { canEdit: canEditFn } = useUserRole();
  const canEdit = canEditFn();
  const { t, isRestrictedUser: isRestrictedUserHook, lang } = useInvoicesTranslation();
  const isRestrictedUser = isRestrictedUserHook;

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleEditClick = (invoice: Invoice) => {
    setEditMode("editar");
    setEditingInvoice(invoice);
  };

  const handleEditSubmit = async (data: Partial<InvoiceFormData>) => {
    if (!editingInvoice) return;
    await onUpdate(editingInvoice.id, data, editingInvoice);
  };

  const handlePreview = (invoice: Invoice) => {
    if (!invoice.attachment?.storage_path) return;

    const publicUrl = getPublicUrl(invoice.attachment.storage_path);
    setPreviewModal({
      url: publicUrl,
      fileName: invoice.attachment.file_name,
    });
  };

  const handleDownload = async (invoice: Invoice) => {
    if (!invoice.attachment?.storage_path) return;

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

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t("Carregando faturas...")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card bg-card dark:bg-[#1c202a] border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-primary h-5 w-5" />
                {t("Faturas")}
              </CardTitle>
              <CardDescription>
                {invoices.length}{" "}
                {lang === "fr"
                  ? `facture${invoices.length !== 1 ? "s" : ""} trouvée${invoices.length !== 1 ? "s" : ""}`
                  : `fatura${invoices.length !== 1 ? "s" : ""} encontrada${invoices.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            {onAddNew && canEdit && !isRestrictedUser && (
              <Button
                onClick={onAddNew}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 text-primary-foreground transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                {t("Nova Fatura")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-border/40 bg-popover dark:bg-[#1c202a] overflow-hidden overflow-x-auto rounded-xl border shadow-sm">
            <Table>
              <TableHeader className="bg-popover border-border/40 border-b">
                <TableRow className="border-b-0 transition-none hover:bg-transparent">
                  <TableHead>{t("Data")}</TableHead>
                  <TableHead>{t("Valor")}</TableHead>
                  <TableHead>{t("Descrição")}</TableHead>
                  <TableHead>{t("Arquivo")}</TableHead>
                  <TableHead className="text-right">{t("Ações")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground h-32 text-center font-medium italic"
                    >
                      {t("Nenhuma fatura encontrada.")}
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="bg-popover hover:bg-muted/30 border-border group cursor-pointer border-b transition-colors last:border-0 dark:border-white/5"
                      onClick={() => setViewingInvoice(invoice)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {formatCurrencyEUR(invoice.amount)}
                      </TableCell>
                      <TableCell
                        className="max-w-[260px]"
                        onClick={(e) => {
                          if (editingDescriptionId === invoice.id) e.stopPropagation();
                        }}
                      >
                        {editingDescriptionId === invoice.id ? (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              autoFocus
                              value={descriptionDraft}
                              onChange={(e) => setDescriptionDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void saveDescription(invoice);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelEditDescription();
                                }
                              }}
                              disabled={savingDescription}
                              className="bg-popover border-border/40 h-8 text-sm"
                              placeholder="Adicionar descrição..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-success hover:bg-success/10"
                              onClick={() => void saveDescription(invoice)}
                              disabled={savingDescription}
                              title="Salvar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted/40"
                              onClick={cancelEditDescription}
                              disabled={savingDescription}
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canEdit && !isRestrictedUser) startEditDescription(invoice);
                            }}
                            className={cn(
                              "group/desc flex w-full items-center gap-2 text-left truncate",
                              canEdit && !isRestrictedUser
                                ? "cursor-text hover:text-primary"
                                : "cursor-default"
                            )}
                            title={
                              canEdit && !isRestrictedUser
                                ? "Clique para editar descrição"
                                : undefined
                            }
                          >
                            <span className="truncate">
                              {invoice.description || (
                                <span className="text-muted-foreground italic">
                                  Adicionar descrição...
                                </span>
                              )}
                            </span>
                            {canEdit && !isRestrictedUser && (
                              <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover/desc:opacity-60 transition-opacity" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {invoice.attachment ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-red-500" />
                            <span className="max-w-[150px] truncate text-xs">
                              {invoice.attachment.file_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {t("Não informado")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingInvoice(invoice)}
                            title={t("Visualizar Fatura")}
                            className="hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {invoice.attachment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(invoice)}
                              title="Download"
                              className="hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          {canEdit && !isRestrictedUser && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(invoice)}
                                title={t("Editar Fatura")}
                                className="hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              {invoice.fatura_emitida_id && onCreate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicate(invoice)}
                                  title="Duplicar Fatura"
                                  disabled={loadingDuplicate}
                                  className="hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-95"
                                onClick={() => onDelete(invoice)}
                                title={t("Deletar")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {invoices.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-end">
                <div className="text-lg font-semibold">
                  {t("Total:")} {formatCurrencyEUR(totalAmount)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent
            className={cn(
              "bg-card dark:bg-[#1c202a] border-border/50 w-[95vw] max-h-[90vh] overflow-y-auto transition-all",
              editMode === "emitir" ? "max-w-4xl" : "max-w-2xl"
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="text-primary h-5 w-5" />
                Editar Fatura
              </DialogTitle>
            </DialogHeader>
            <EditInvoiceTabs
              invoice={editingInvoice}
              onSubmit={handleEditSubmit}
              isSubmitting={isUpdating}
              onSuccess={() => setEditingInvoice(null)}
              onModeChange={setEditMode}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Invoice Details Modal */}
      {viewingInvoice && (
        <Dialog open={!!editingInvoice || !!viewingInvoice} onOpenChange={() => { setEditingInvoice(null); setViewingInvoice(null); }}>
          <DialogContent className="bg-popover dark:bg-[#1c202a] border-border/50 w-[95vw] max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <FileText className="text-primary h-5 w-5" />
                {t("Detalhes da Fatura")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    {t("Data da fatura")}
                  </Label>
                  <p className="text-sm font-semibold">
                    {new Date(viewingInvoice.invoice_date).toLocaleDateString(
                      lang === "fr" ? "fr-FR" : "pt-BR"
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    {t("Valor Total")}
                  </Label>
                  <p className="text-primary text-lg font-black">
                    {formatCurrencyEUR(viewingInvoice.amount)}
                  </p>
                </div>
                {viewingInvoice.description && (
                  <div className="col-span-2 space-y-1 md:col-span-1">
                    <Label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                      {t("Observações")}
                    </Label>
                    <p
                      className="text-muted-foreground line-clamp-2 text-sm"
                      title={viewingInvoice.description}
                    >
                      {viewingInvoice.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="">
                <InvoiceAttachmentManager
                  invoice={viewingInvoice}
                  onUpdate={() => {
                    onRefresh();
                    setViewingInvoice(null);
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Duplicar Fatura Modal */}
      {duplicateInitialData && onCreate && (
        <Dialog
          open={!!duplicateInitialData}
          onOpenChange={(open) => !open && setDuplicateInitialData(null)}
        >
          <DialogContent className="bg-card dark:bg-[#1c202a] border-border/50 w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Copy className="text-primary h-5 w-5" />
                Duplicar Fatura
              </DialogTitle>
            </DialogHeader>
            <EmitirFaturaPanel
              initialData={duplicateInitialData}
              onSubmitEmission={(data) => onCreate(data)}
              isSubmitting={isCreating}
              onSuccess={() => {
                setDuplicateInitialData(null);
                onRefresh();
              }}
              submitLabel="Emitir Nova Fatura"
              submittingLabel="A emitir..."
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <Dialog open={!!previewModal} onOpenChange={() => setPreviewModal(null)}>
          <DialogContent className="bg-background border-border/50 max-h-[90vh] w-[95vw] max-w-4xl p-0">
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
                  {t("Abrir em nova aba")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
