
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Download, Edit, Trash2, FileText, ExternalLink, Paperclip, Plus } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceAttachmentManager } from './InvoiceAttachmentManager';
import { formatCurrencyEUR } from '@/lib/utils/currency';
import { useLocale } from '@/contexts/LocaleContext';

interface InvoiceListProps {
  invoices: Invoice[];
  onUpdate: (id: string, data: { invoice_date: string; amount: number; description?: string }) => void;
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
  onAddNew
}) => {
  const { hasRole } = useUserRole();
  const { user } = useAuth();
  const { locale } = useLocale();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editFormData, setEditFormData] = useState({
    invoice_date: '',
    amount: 0,
    description: ''
  });
  const [previewModal, setPreviewModal] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  const { canEdit: canEditFn } = useUserRole();
  const canEdit = canEditFn();
  const isRestrictedUser = user?.email?.toLowerCase() === "ham@admin.com";

  // i18n
  const lang: "pt" | "fr" = isRestrictedUser ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string, fr: string }> = {
      "Faturas": { pt: "Faturas", fr: "Factures" },
      "Gestão de faturas e documentos fiscais": { pt: "Gestão de faturas e documentos fiscais", fr: "Gestion des factures et documents fiscaux" },
      "Nova Fatura": { pt: "Nova Fatura", fr: "Nouvelle Facture" },
      "Data": { pt: "Data", fr: "Date" },
      "Valor": { pt: "Valor", fr: "Valeur" },
      "Descrição": { pt: "Descrição", fr: "Description" },
      "Arquivo": { pt: "Arquivo", fr: "Fichier" },
      "Anexos": { pt: "Anexos", fr: "Pièces jointes" },
      "Ações": { pt: "Ações", fr: "Actions" },
      "Carregando faturas...": { pt: "Carregando faturas...", fr: "Chargement des factures..." },
      "Nenhuma fatura encontrada.": { pt: "Nenhuma fatura encontrada.", fr: "Aucune facture trouvée." },
      "Editar Fatura": { pt: "Editar Fatura", fr: "Modifier la Facture" },
      "Atualize os dados da fatura": { pt: "Atualize os dados da fatura", fr: "Mettre à jour les données de la facture" },
      "Visualizar Fatura": { pt: "Visualizar Fatura", fr: "Voir la Facture" },
      "Deletar": { pt: "Deletar", fr: "Supprimer" },
      "Confirmar Exclusão": { pt: "Confirmar Exclusão", fr: "Confirmer la suppression" },
      "Tem certeza que deseja deletar esta fatura?": { pt: "Tem certeza que deseja deletar esta fatura?", fr: "Êtes-vous sûr de vouloir supprimer cette facture ?" },
      "Cancelar": { pt: "Cancelar", fr: "Annuler" },
      "Salvar": { pt: "Salvar", fr: "Enregistrer" },
      "Data da fatura": { pt: "Data da fatura", fr: "Date de la facture" },
      "O valor deve ser maior que zero.": { pt: "O valor deve ser maior que zero.", fr: "La valeur doit être supérieure à zéro." },
      "A data da fatura não pode ser futura.": { pt: "A data da fatura não pode ser futura.", fr: "La date de la facture ne peut pas être future." },
      "Detalhes da Fatura": { pt: "Detalhes da Fatura", fr: "Détails de la Facture" },
      "Valor Total": { pt: "Valor Total", fr: "Valeur Totale" },
      "Observações": { pt: "Observações", fr: "Observations" },
      "Abrir em nova aba": { pt: "Abrir em nova aba", fr: "Ouvrir dans un nouvel onglet" },
      "Não informado": { pt: "Não informado", fr: "Non renseigné" },
      "Total:": { pt: "Total:", fr: "Total :" },
    };
    return d[k]?.[lang] || k;
  };

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleEditClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditFormData({
      invoice_date: invoice.invoice_date,
      amount: invoice.amount,
      description: invoice.description || ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const today = new Date().toISOString().split('T')[0];
    if (editFormData.invoice_date > today) {
      alert(t('A data da fatura não pode ser futura.'));
      return;
    }

    if (editFormData.amount <= 0) {
      alert(t('O valor deve ser maior que zero.'));
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
      fileName: invoice.attachment.file_name
    });
  };

  const handleDownload = async (invoice: Invoice) => {
    if (!invoice.attachment?.storage_path) return;

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
      <Card className="shadow-card bg-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("Faturas")}
              </CardTitle>
              <CardDescription>
                {invoices.length} {lang === 'fr'
                  ? `facture${invoices.length !== 1 ? 's' : ''} trouvée${invoices.length !== 1 ? 's' : ''}`
                  : `fatura${invoices.length !== 1 ? 's' : ''} encontrada${invoices.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </div>
            {onAddNew && canEdit && !isRestrictedUser && (
              <Button
                onClick={onAddNew}
                className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {t("Nova Fatura")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border/40 overflow-hidden bg-popover shadow-sm">
            <Table>
              <TableHeader className="bg-popover border-b border-border/40">
                <TableRow className="hover:bg-transparent transition-none border-b-0">
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
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic font-medium">
                      {t("Nenhuma fatura encontrada.")}
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="bg-popover hover:bg-muted/30 transition-colors border-b border-border dark:border-white/5 last:border-0 cursor-pointer group"
                      onClick={() => setViewingInvoice(invoice)}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {formatCurrencyEUR(invoice.amount)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {invoice.description || '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.attachment ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-red-500" />
                            <span className="text-xs truncate max-w-[150px]">
                              {invoice.attachment.file_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t("Não informado")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingInvoice(invoice)}
                            title={t("Visualizar Fatura")}
                            className="hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {invoice.attachment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(invoice)}
                              title="Download"
                              className="hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Download className="w-4 h-4" />
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
                                <Edit className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                onClick={() => onDelete(invoice)}
                                title={t("Deletar")}
                              >
                                <Trash2 className="w-4 h-4" />
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
            <div className="mt-4 pt-4 border-t">
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
          <DialogContent className="w-[95vw] max-w-md bg-card border-border/50" >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Editar Fatura
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit_date" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Data da Fatura</Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={editFormData.invoice_date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-popover border-border/40 font-semibold h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_amount" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Valor</Label>
                <div className="relative group">
                  <Input
                    id="edit_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editFormData.amount || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    required
                    className="pl-8 bg-popover border-border/40 font-semibold h-11"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">€</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Descrição</Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="bg-popover border-border/40 resize-none py-2.5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="gradient" className="flex-1 h-12 text-base font-bold">
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="cancel"
                  onClick={() => setEditingInvoice(null)}
                  className="flex-1 h-12 font-semibold bg-popover border-border/40"
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
        <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
          <DialogContent className="w-[95vw] max-w-3xl bg-popover border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("Detalhes da Fatura")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("Data da fatura")}</Label>
                  <p className="text-sm font-semibold">
                    {new Date(viewingInvoice.invoice_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'pt-BR')}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("Valor Total")}</Label>
                  <p className="text-lg font-black text-primary">{formatCurrencyEUR(viewingInvoice.amount)}</p>
                </div>
                {viewingInvoice.description && (
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("Observações")}</Label>
                    <p className="text-sm text-muted-foreground line-clamp-2" title={viewingInvoice.description}>
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
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-0 bg-background border-border/50">
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
