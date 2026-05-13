import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, FileSignature, Upload, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmitirFaturaPanel } from "@/components/fatura/EmitirFaturaPanel";
import type { Invoice, InvoiceFormData } from "@/types/invoice";

interface EditInvoiceTabsProps {
  invoice: Invoice;
  onSubmit: (data: Partial<InvoiceFormData>) => Promise<unknown>;
  isSubmitting?: boolean;
  onSuccess?: () => void;
  onModeChange?: (mode: "editar" | "emitir") => void;
}

export const EditInvoiceTabs: React.FC<EditInvoiceTabsProps> = ({
  invoice,
  onSubmit,
  isSubmitting = false,
  onSuccess,
  onModeChange,
}) => {
  const [mode, setMode] = useState<"editar" | "emitir">("editar");

  const [editForm, setEditForm] = useState({
    invoice_date: invoice.invoice_date,
    amount: invoice.amount,
    description: invoice.description ?? "",
  });
  const [newFile, setNewFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo permitido: 10MB.");
      return;
    }
    setNewFile(file);
  };

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    if (editForm.invoice_date > today) {
      toast.error("A data da fatura não pode ser futura.");
      return;
    }
    if (editForm.amount <= 0) {
      toast.error("O valor deve ser maior que zero.");
      return;
    }
    try {
      await onSubmit({
        invoice_date: editForm.invoice_date,
        amount: editForm.amount,
        description: editForm.description,
        file: newFile ?? undefined,
      });
      onSuccess?.();
    } catch {
      // toast já exibido pelo hook
    }
  };

  return (
    <Tabs
      value={mode}
      onValueChange={(v) => {
        const next = v as "editar" | "emitir";
        setMode(next);
        onModeChange?.(next);
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="editar" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar dados
        </TabsTrigger>
        <TabsTrigger value="emitir" className="gap-2">
          <FileSignature className="h-4 w-4" />
          Emitir nova fatura
        </TabsTrigger>
      </TabsList>

      <TabsContent value="editar" className="mt-4">
        <form onSubmit={handleSaveBasic} className="space-y-4 pt-2">
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
              value={editForm.invoice_date}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, invoice_date: e.target.value }))
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
                value={editForm.amount || ""}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                required
                className="bg-popover border-border/40 h-11 pl-8 font-semibold"
              />
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
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
              value={editForm.description}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              placeholder="Adicione ou edite a descrição..."
              className="bg-popover border-border/40 resize-none py-2.5"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="edit_file"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Substituir PDF anexado (opcional)
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="edit_file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="bg-popover border-border/40 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 h-11 flex-1 file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
              {newFile && (
                <div className="bg-success/10 text-success border-success/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <Upload className="h-4 w-4" />
                  <span className="max-w-[180px] truncate">{newFile.name}</span>
                </div>
              )}
            </div>
            {invoice.attachment ? (
              <p className="text-muted-foreground text-[10px] leading-relaxed italic">
                Anexo atual: {invoice.attachment.file_name}. Selecionar um novo PDF substitui o atual.
              </p>
            ) : (
              <p className="text-muted-foreground text-[10px] leading-relaxed italic">
                Nenhum anexo atual. Selecionar um PDF anexa-o à fatura.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              className="h-12 flex-1 text-base font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="emitir" className="mt-4">
        <EmitirFaturaPanel
          onSubmitEmission={(data) => onSubmit(data)}
          isSubmitting={isSubmitting}
          onSuccess={onSuccess}
          submitLabel="Emitir e Substituir Anexo"
          submittingLabel="A emitir e substituir..."
        />
      </TabsContent>
    </Tabs>
  );
};
