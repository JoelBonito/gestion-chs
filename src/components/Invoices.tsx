
import React from 'react';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceList } from './InvoiceList';
import { useInvoices } from '@/hooks/useInvoices';

export const Invoices: React.FC = () => {
  const {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    isCreating
  } = useInvoices();

  return (
    <div className="space-y-6">
      <InvoiceForm 
        onSubmit={createInvoice}
        isSubmitting={isCreating}
      />
      
      <InvoiceList
        invoices={invoices}
        onUpdate={updateInvoice}
        onDelete={deleteInvoice}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Invoices;
