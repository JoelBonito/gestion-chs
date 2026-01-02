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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Download, Edit, Trash2, FileText, ExternalLink, Paperclip, Plus } from "lucide-react";
import { Invoice } from "@/types/invoice";
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
    data: { invoice_date: string; amount: number; description?: string }
  ) => void;
  onDelete: (invoice: Invoice) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  onAddNew?: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onUpdate,
  onDelete,
  onRefresh,
  isLoading = false,
  onAddNew,
}) => {
  const { hasRole } = useUserRole();
  const { user } = useAuth();
  const { locale } = useLocale();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editFormData, setEditFormData] = useState({
    invoice_date: "",
    amount: 0,
    description: "",
  });
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  const { canEdit: canEditFn } = useUserRole();
  const canEdit = canEditFn();
  const { t, isRestrictedUser: isRestrictedUserHook, lang } = useInvoicesTranslation();
  const isRestrictedUser = isRestrictedUserHook;

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleEditClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditFormData({
      invoice_date: invoice.invoice_date,
      amount: invoice.amount,
      description: invoice.description || "",
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const today = new Date().toISOString().split("T")[0];
    if (editFormData.invoice_date > today) {
      alert(t("A data da fatura não pode ser futura."));
      return;
    }

    if (editFormData.amount <= 0) {
      alert(t("O valor deve ser maior que zero."));
      return;
    }

    onUpdate(editingInvoice.id, editFormData);
    setEditingInvoice(null);
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
                      <TableCell className="max-w-[200px] truncate">
                        {invoice.description || "-"}
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
          <DialogContent className="bg-card dark:bg-[#1c202a] border-border/50 w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="text-primary h-5 w-5" />
                Editar Fatura
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label
                  htmlFor="edit_date"
                  className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                >
                  Data da Fatura
                </Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={editFormData.invoice_date}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, invoice_date: e.target.value }))
                  }
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="bg-popover border-border/40 h-11 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit_amount"
                  className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                >
                  Valor
                </Label>
                <div className="group relative">
                  <Input
                    id="edit_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editFormData.amount || ""}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    className="bg-popover border-border/40 h-11 pl-8 font-semibold"
                  />
                  <span className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 transition-colors">
                    €
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit_description"
                  className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                >
                  Descrição
                </Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                  className="bg-popover border-border/40 resize-none py-2.5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="gradient"
                  className="h-12 flex-1 text-base font-bold"
                >
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="cancel"
                  onClick={() => setEditingInvoice(null)}
                  className="bg-popover border-border/40 h-12 flex-1 font-semibold"
                >
                  Cancelar
                </Button>
              </div>
            </form>
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
