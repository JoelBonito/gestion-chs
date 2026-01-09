import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceList } from './InvoiceList';
import { useInvoices } from '@/hooks/useInvoices';
import { useLocale } from '@/contexts/LocaleContext';

export const Invoices: React.FC = () => {
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const { locale, isRestrictedFR } = useLocale();

  const {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refetch,
    isCreating
  } = useInvoices();

  const handleCreateInvoice = async (data: any) => {
    try {
      await createInvoice(data);
      setShowNewInvoiceDialog(false);
    } catch (error) {
      console.error('Erro ao criar fatura:', error);
    }
  };

  return (
    <div className="space-y-6">
      <InvoiceList
        invoices={invoices}
        onUpdate={updateInvoice}
        onDelete={deleteInvoice}
        onRefresh={refetch}
        isLoading={isLoading}
        onAddNew={() => setShowNewInvoiceDialog(true)}
      />

      <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
        <DialogContent className="w-[95vw] max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>{locale === 'fr-FR' ? 'Nouvelle Facture' : 'Nova Fatura'}</DialogTitle>
            <DialogDescription>
              {locale === 'fr-FR' ? 'Remplissez les informations pour créer une nouvelle facture.' : 'Preencha os dados para criar uma nova fatura.'}
            </DialogDescription>
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
