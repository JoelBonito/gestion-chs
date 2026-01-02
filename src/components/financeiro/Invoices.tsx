import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceList } from "./InvoiceList";
import { useInvoices } from "@/hooks/useInvoices";
import { useInvoicesTranslation } from "@/hooks/useInvoicesTranslation";
import { useLocale } from "@/contexts/LocaleContext";
import { InvoiceFormData } from "@/types/invoice";

export const Invoices: React.FC = () => {
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const { t } = useInvoicesTranslation();

  const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice, refetch, isCreating } =
    useInvoices();

  const handleCreateInvoice = async (data: InvoiceFormData) => {
    try {
      await createInvoice(data);
      setShowNewInvoiceDialog(false);
    } catch (error) {
      console.error("Erro ao criar fatura:", error);
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
        <DialogContent className="bg-card dark:bg-[#1c202a] border-border/50 w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Nova Fatura")}</DialogTitle>
            <DialogDescription>
              {t("Preencha os dados para criar uma nova fatura.")}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm onSubmit={handleCreateInvoice} isSubmitting={isCreating} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
