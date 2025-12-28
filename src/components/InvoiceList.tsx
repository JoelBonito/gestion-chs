
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

  const canEdit = hasRole('admin') || hasRole('finance');
  const isRestrictedUser = user?.email?.toLowerCase() === "ham@admin.com";

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
      alert('A data da fatura não pode ser futura.');
      return;
    }

    if (editFormData.amount <= 0) {
      alert('O valor deve ser maior que zero.');
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
          <p className="text-muted-foreground">Carregando faturas...</p>
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
                {locale === 'fr-FR' ? 'Factures' : 'Faturas'}
              </CardTitle>
              <CardDescription>
                {invoices.length} {locale === 'fr-FR'
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
                {locale === 'fr-FR' ? 'Nouvelle Facture' : 'Nova Fatura'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabela apenas no desktop */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-border/40 overflow-hidden bg-popover shadow-sm">
            <Table>
              <TableHeader className="bg-popover border-b border-border/40">
                <TableRow className="hover:bg-transparent transition-none border-b-0">
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="bg-popover hover:bg-muted/30 transition-colors border-b border-border dark:border-white/5 last:border-0 cursor-pointer group"
                    onClick={() => setViewingInvoice(invoice)}
                  >
                    <TableCell className="font-medium">
                      {new Date(invoice.invoice_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrencyEUR(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      {invoice.description || '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.attachment ? (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-red-500" />
                          <span className="text-xs truncate max-w-[100px]">
                            {invoice.attachment.file_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem documento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setViewingInvoice(invoice); }}
                          title="Ver detalhes"
                          className="hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {invoice.attachment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDownload(invoice); }}
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
                              onClick={(e) => { e.stopPropagation(); handleEditClick(invoice); }}
                              title="Editar"
                              className="hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                              onClick={(e) => { e.stopPropagation(); onDelete(invoice); }}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Lista em cartões no mobile/tablet */}
          <div className="lg:hidden space-y-3">
            {invoices.length === 0 && (
              <Card className="shadow-none border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Nenhuma fatura encontrada
                </CardContent>
              </Card>
            )}
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="overflow-hidden bg-card border-border/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">
                      {new Date(invoice.invoice_date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm font-semibold">
                      {formatCurrencyEUR(invoice.amount)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {invoice.description || 'Sem descrição'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.attachment ? (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-red-500" />
                        <span className="truncate">{invoice.attachment.file_name}</span>
                      </div>
                    ) : (
                      'Sem documento'
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setViewingInvoice(invoice)}>
                      <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                    </Button>
                    {invoice.attachment && (
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleDownload(invoice)}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    )}
                    {canEdit && !isRestrictedUser && (
                      <>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleEditClick(invoice)}>
                          <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto text-destructive hover:text-destructive" onClick={() => onDelete(invoice)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {invoices.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end">
                <div className="text-lg font-semibold">
                  Total: {formatCurrencyEUR(totalAmount)}
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
          <DialogContent className="w-[95vw] max-w-3xl bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalhes da Fatura
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-popover p-4 rounded-xl border border-border/20 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Data da Fatura</Label>
                    <p className="text-sm font-semibold">
                      {new Date(viewingInvoice.invoice_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Valor Total</Label>
                    <p className="text-lg font-black text-primary">{formatCurrencyEUR(viewingInvoice.amount)}</p>
                  </div>
                  {viewingInvoice.description && (
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Observações</Label>
                      <p className="text-sm text-muted-foreground line-clamp-2" title={viewingInvoice.description}>
                        {viewingInvoice.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-popover p-4 rounded-xl border border-border/20 shadow-sm">
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
