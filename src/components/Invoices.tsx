
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceList } from './InvoiceList';
import { useInvoices } from '@/hooks/useInvoices';

export const Invoices: React.FC = () => {
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  
  const {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    isCreating
  } = useInvoices();

  const handleCreateInvoice = async (data: any) => {
    try {
      await createInvoice(data);
      setShowNewInvoiceDialog(false);
    } catch (error) {
      // O erro já é tratado no hook useInvoices
      console.error('Erro ao criar fatura:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with New Invoice Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Faturas</h2>
          <p className="text-muted-foreground">Gerencie suas faturas e documentos</p>
        </div>
        <Button 
          onClick={() => setShowNewInvoiceDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Fatura
        </Button>
      </div>

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
        onUpdate={updateInvoice}
        onDelete={deleteInvoice}
        isLoading={isLoading}
      />

      {/* New Invoice Dialog */}
      <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Fatura</DialogTitle>
          </DialogHeader>
          <InvoiceForm 
            onSubmit={handleCreateInvoice}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
