import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NovaFaturaTabs } from "./NovaFaturaTabs";
import { InvoiceList } from "./InvoiceList";
import { useInvoices } from "@/hooks/useInvoices";
import { useInvoicesTranslation } from "@/hooks/useInvoicesTranslation";
import { InvoiceFormData } from "@/types/invoice";

export const Invoices: React.FC = () => {
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [mode, setMode] = useState<"anexar" | "emitir">("anexar");
  const { t } = useInvoicesTranslation();

  const {
    invoices,
    isLoading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refetch,
    isCreating,
    isUpdating,
  } = useInvoices();

  const handleCreateInvoice = async (data: InvoiceFormData) => {
    await createInvoice(data);
  };

  return (
    <div className="space-y-6">
      <InvoiceList
        invoices={invoices}
        onUpdate={updateInvoice}
        onCreate={handleCreateInvoice}
        onDelete={deleteInvoice}
        onRefresh={refetch}
        isLoading={isLoading}
        isUpdating={isUpdating}
        isCreating={isCreating}
        onAddNew={() => {
          setMode("anexar");
          setShowNewInvoiceDialog(true);
        }}
      />

      <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
        <DialogContent
          className={cn(
            "bg-card dark:bg-[#1c202a] border-border/50 w-[95vw] max-h-[90vh] overflow-y-auto transition-all",
            mode === "emitir" ? "max-w-4xl" : "max-w-2xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("Nova Fatura")}</DialogTitle>
            <DialogDescription>
              {t("Preencha os dados para criar uma nova fatura.")}
            </DialogDescription>
          </DialogHeader>
          <NovaFaturaTabs
            onSubmit={handleCreateInvoice}
            isSubmitting={isCreating}
            onSuccess={() => setShowNewInvoiceDialog(false)}
            onModeChange={setMode}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
