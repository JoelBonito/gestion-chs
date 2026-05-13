import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSignature, Paperclip } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { EmitirFaturaPanel } from "@/components/fatura/EmitirFaturaPanel";
import type { InvoiceFormData } from "@/types/invoice";

interface NovaFaturaTabsProps {
  onSubmit: (data: InvoiceFormData) => Promise<unknown>;
  isSubmitting?: boolean;
  onSuccess?: () => void;
  onModeChange?: (mode: "anexar" | "emitir") => void;
}

export const NovaFaturaTabs: React.FC<NovaFaturaTabsProps> = ({
  onSubmit,
  isSubmitting = false,
  onSuccess,
  onModeChange,
}) => {
  const [mode, setMode] = useState<"anexar" | "emitir">("anexar");

  const handleAnexarSubmit = async (data: InvoiceFormData) => {
    await onSubmit(data);
    onSuccess?.();
  };

  return (
    <Tabs
      value={mode}
      onValueChange={(v) => {
        const next = v as "anexar" | "emitir";
        setMode(next);
        onModeChange?.(next);
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="anexar" className="gap-2">
          <Paperclip className="h-4 w-4" />
          Anexar PDF
        </TabsTrigger>
        <TabsTrigger value="emitir" className="gap-2">
          <FileSignature className="h-4 w-4" />
          Emitir Fatura
        </TabsTrigger>
      </TabsList>

      <TabsContent value="anexar" className="mt-4">
        <InvoiceForm onSubmit={handleAnexarSubmit} isSubmitting={isSubmitting} />
      </TabsContent>

      <TabsContent value="emitir" className="mt-4">
        <EmitirFaturaPanel
          onSubmitEmission={onSubmit}
          isSubmitting={isSubmitting}
          onSuccess={onSuccess}
        />
      </TabsContent>
    </Tabs>
  );
};
