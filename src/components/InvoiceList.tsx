
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Download, Edit, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Invoice } from '@/types/invoice';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceListProps {
  invoices: Invoice[];
  onUpdate: (id: string, data: { invoice_date: string; amount: number; description?: string }) => void;
  onDelete: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onUpdate,
  onDelete,
  isLoading = false
}) => {
  const { hasRole } = useUserRole();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
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

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('invoices').getPublicUrl(storagePath);
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
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Faturas</CardTitle>
          <CardDescription>
            {invoices.length} fatura{invoices.length !== 1 ? 's' : ''} encontrada{invoices.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {new Date(invoice.invoice_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      €{invoice.amount.toFixed(2)}
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
                        {invoice.attachment && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(invoice)}
                              title="Visualizar"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(getPublicUrl(invoice.attachment!.storage_path), '_blank')}
                              title="Abrir em nova aba"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(invoice)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(invoice)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDelete(invoice)}
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

          {invoices.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end">
                <div className="text-lg font-semibold">
                  Total: €{totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Fatura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_date">Data da Fatura</Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={editFormData.invoice_date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_amount">Valor (€)</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editFormData.amount || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Descrição</Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingInvoice(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

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
