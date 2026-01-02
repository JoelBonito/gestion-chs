import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Upload, Save } from "lucide-react";
import { InvoiceFormData } from "@/types/invoice";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_date: new Date().toISOString().split("T")[0],
    amount: 0,
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { hasRole } = useUserRole();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    })();
  }, []);

  // Permissão: admin role OU finance role OU e-mails autorizados
  const isRestrictedUser = userEmail?.toLowerCase() === "ham@admin.com";
  const canCreate =
    (hasRole("admin") ||
      hasRole("finance") ||
      userEmail?.toLowerCase() === "admin@admin.com" ||
      userEmail?.toLowerCase() === "jbento1@gmail.com") &&
    !isRestrictedUser;

  // i18n
  const lang: "pt" | "fr" = isRestrictedUser ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      "Data da Fatura": { pt: "Data da Fatura", fr: "Date de la facture" },
      "Valor da Fatura": { pt: "Valor da Fatura", fr: "Montant de la facture" },
      "Descrição (Opcional)": { pt: "Descrição (Opcional)", fr: "Description (Optionnel)" },
      "Descrição da fatura...": {
        pt: "Descrição da fatura...",
        fr: "Description de la facture...",
      },
      "Documento PDF (Opcional)": {
        pt: "Documento PDF (Opcional)",
        fr: "Document PDF (Optionnel)",
      },
      "A data da fatura não pode ser futura.": {
        pt: "A data da fatura não pode ser futura.",
        fr: "La date de la facture ne peut pas être future.",
      },
      "O valor deve ser maior que zero.": {
        pt: "O valor deve ser maior que zero.",
        fr: "La valeur doit être supérieure à zéro.",
      },
      "Apenas arquivos PDF são permitidos.": {
        pt: "Apenas arquivos PDF são permitidos.",
        fr: "Seuls les fichiers PDF sont autorisés.",
      },
      "Arquivo muito grande. Máximo permitido: 10MB": {
        pt: "Arquivo muito grande. Máximo permitido: 10MB",
        fr: "Fichier trop volumineux. Maximum autorisé : 10 Mo",
      },
      "Você não tem permissão para criar faturas.": {
        pt: "Você não tem permissão para criar faturas.",
        fr: "Vous n'avez pas la permission de créer des factures.",
      },
      "Salvando Fatura...": { pt: "Salvando Fatura...", fr: "Enregistrement de la facture..." },
      "Salvar Fatura": { pt: "Salvar Fatura", fr: "Enregistrer la facture" },
      "* Anexe um arquivo PDF até 10MB.": {
        pt: "* Anexe um arquivo PDF até 10MB.",
        fr: "* Joindre un fichier PDF jusqu'à 10 Mo.",
      },
    };
    return d[k]?.[lang] || k;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    const today = new Date().toISOString().split("T")[0];
    if (formData.invoice_date > today) {
      alert(t("A data da fatura não pode ser futura."));
      return;
    }
    if (formData.amount <= 0) {
      alert(t("O valor deve ser maior que zero."));
      return;
    }
    try {
      await onSubmit({
        ...formData,
        file: selectedFile || undefined,
      });
      setFormData({
        invoice_date: new Date().toISOString().split("T")[0],
        amount: 0,
        description: "",
      });
      setSelectedFile(null);
    } catch (error) {
      console.error("Erro ao submeter fatura:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert(t("Apenas arquivos PDF são permitidos."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(t("Arquivo muito grande. Máximo permitido: 10MB"));
      return;
    }
    setSelectedFile(file);
  };

  if (!canCreate) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground" id="no-permission">
          {t("Você não tem permissão para criar faturas.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        aria-describedby="invoice-form-description"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="invoice_date"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              {t("Data da Fatura")}
            </Label>
            <div className="group relative">
              <Calendar className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoice_date: e.target.value }))}
                className="bg-popover border-border/40 focus:ring-primary/20 h-11 pl-10 font-semibold transition-all"
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              {t("Valor da Fatura")}
            </Label>
            <div className="group relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
                className="bg-popover border-border/40 focus:ring-primary/20 h-11 pl-8 font-semibold transition-all"
                required
              />
              <span className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 transition-colors">
                €
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
          >
            {t("Descrição (Opcional)")}
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t("Descrição da fatura...")}
            rows={2}
            className="bg-popover border-border/40 focus:ring-primary/20 min-h-[44px] resize-none py-2.5 transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="file"
            className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
          >
            {t("Documento PDF (Opcional)")}
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="bg-popover border-border/40 file:bg-primary/10 file:text-primary hover:file:bg-primary/20 h-11 flex-1 transition-all file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
            />
            {selectedFile && (
              <div className="bg-success/10 text-success border-success/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold">
                <Upload className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{selectedFile.name}</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-[10px] leading-relaxed italic">
            {t("* Anexe um arquivo PDF até 10MB.")}
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 shadow-primary/20 h-12 w-full text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Upload className="mr-2 h-5 w-5 animate-spin" />
                {t("Salvando Fatura...")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                {t("Salvar Fatura")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
