import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/contexts/LocaleContext";

// Sub-abas/components
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro"; // (Vendas - Clientes)
import Invoices from "@/components/Invoices";                         // (Faturas)
// Se sua sub-aba de fornecedores (Compras) tiver outro nome, ajuste o import abaixo:
import FornecedoresFinanceiro from "@/components/FornecedoresFinanceiro"; // (Compras - Fornecedores)

type Lang = "pt" | "fr";

export default function Financeiro() {
  const { isRestrictedFR } = useLocale();
  const lang: Lang = isRestrictedFR ? "fr" : "pt";

  // Dica: se você já controlava defaultValue externamente, pode remover esse efeito.
  // Mantemos a navegação padrão: ham entra direto em "receber" (agora rotulado como VENDAS).
  useEffect(() => {
    // Nada a fazer aqui se o Tabs já usa defaultValue="receber".
  }, []);

  // Helper simples para rótulos da UI (sem mexer nos values internos)
  const t = (k: string): string => {
    const d: Record<string, { pt: string; fr: string }> = {
      Vendas: { pt: "Vendas", fr: "Ventes" },
      Compras: { pt: "Compras", fr: "Achats" },
      Faturas: { pt: "Faturas", fr: "Factures" },
    };
    return d[k]?.[lang] ?? k;
  };

  // Regras de visibilidade já existentes para ham: mostrar Vendas e Faturas.
  const showOnlySalesAndInvoices = isRestrictedFR;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="receber" className="w-full">
        <TabsList>
          <TabsTrigger value="receber">{t("Vendas")}</TabsTrigger>

          {!showOnlySalesAndInvoices && (
            <TabsTrigger value="pagar">{t("Compras")}</TabsTrigger>
          )}

          <TabsTrigger value="faturas">{t("Faturas")}</TabsTrigger>
        </TabsList>

        {/* VENDAS (ex A Receber) */}
        <TabsContent value="receber" className="mt-4">
          {/* O componente já cuida de PT/FR via useLocale() */}
          <EncomendasFinanceiro />
        </TabsContent>

        {/* COMPRAS (ex A Pagar) — oculto para ham */}
        {!showOnlySalesAndInvoices && (
          <TabsContent value="pagar" className="mt-4">
            <FornecedoresFinanceiro />
          </TabsContent>
        )}

        {/* FATURAS */}
        <TabsContent value="faturas" className="mt-4">
          {/* Se o seu <Invoices /> aceitar prop lang, pode passar: lang={lang} */}
          <Invoices />
        </TabsContent>
      </Tabs>
    </div>
  );
}
