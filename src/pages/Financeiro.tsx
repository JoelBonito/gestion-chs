import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro"; // Vendas
import ContasPagar from "@/components/ContasPagar";                 // Compras
import Invoices from "@/components/Invoices";                       // Faturas

type TabKey = "encomendas" | "pagar" | "faturas";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<TabKey>("encomendas");
  const [showInactive, setShowInactive] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resumo, setResumo] = useState({ a_receber: 0, a_pagar: 0, saldo: 0 });
  const [loadingResumo, setLoadingResumo] = useState(true);

  const isHam = (userEmail?.toLowerCase() ?? "") === "ham@admin.com";
  const isFelipe = (userEmail?.toLowerCase() ?? "") === "felipe@colaborador.com";

  // i18n básico
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      Vendas: { pt: "Vendas", fr: "Ventes" },
      Compras: { pt: "Compras", fr: "Achats" },
      Faturas: { pt: "Faturas", fr: "Factures" },
      "Mostrar inativos": { pt: "Mostrar inativos", fr: "Afficher inactifs" },
      "Total a Receber": { pt: "Total a Receber", fr: "Total à recevoir" },
      "Total a Pagar": { pt: "Total a Pagar", fr: "Total à payer" },
      "Saldo Atual": { pt: "Saldo Atual", fr: "Solde actuel" },
      "Carregando resumo...": { pt: "Carregando resumo...", fr: "Chargement du résumé..." },
    };
    return d[k]?.[lang] ?? k;
  };

  // pega usuário e define tab padrão
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email ?? null;
      setUserEmail(email);
      if (email?.toLowerCase() === "ham@admin.com") {
        setActiveTab("encomendas");
      } else if (email?.toLowerCase() === "felipe@colaborador.com") {
        setActiveTab("pagar");
      } else {
        setActiveTab("encomendas");
      }
    })();
  }, []);

  // resumo financeiro baseado na Dashboard
  useEffect(() => {
    const fetchResumo = async () => {
      setLoadingResumo(true);
      try {
        // total a receber
        const { data: receber, error: errReceber } = await supabase
          .from("encomendas")
          .select("saldo_devedor")
          .gt("saldo_devedor", 0);
        if (errReceber) throw errReceber;
        const totalReceber = (receber ?? []).reduce(
          (sum, row) => sum + (parseFloat(String(row.saldo_devedor || 0)) || 0),
          0
        );

        // total a pagar
        const { data: pagar, error: errPagar } = await supabase
          .from("encomendas")
          .select("saldo_devedor_fornecedor")
          .gt("saldo_devedor_fornecedor", 0);
        if (errPagar) throw errPagar;
        const totalPagar = (pagar ?? []).reduce(
          (sum, row) => sum + (parseFloat(String(row.saldo_devedor_fornecedor || 0)) || 0),
          0
        );

        setResumo({
          a_receber: totalReceber,
          a_pagar: totalPagar,
          saldo: totalReceber - totalPagar,
        });
      } catch (e) {
        console.error("Erro ao carregar resumo financeiro:", e);
      } finally {
        setLoadingResumo(false);
      }
    };
    fetchResumo();
  }, []);

  // regras de visibilidade
  const hideVendas = isFelipe;
  const hideCompras = isHam;
  const hideFaturas = isFelipe;

  return (
    <div className="px-4 md:px-8">
      {/* Cards sempre visíveis */}
      {loadingResumo ? (
        <p className="text-muted-foreground mb-4">{t("Carregando resumo...")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t("Total a Receber")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatCurrencyEUR(resumo.a_receber)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t("Total a Pagar")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatCurrencyEUR(resumo.a_pagar)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t("Saldo Atual")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatCurrencyEUR(resumo.saldo)}</CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideVendas && <TabsTrigger value="encomendas">{t("Vendas")}</TabsTrigger>}
          {!hideCompras && <TabsTrigger value="pagar">{t("Compras")}</TabsTrigger>}
          {!hideFaturas && <TabsTrigger value="faturas">{t("Faturas")}</TabsTrigger>}
        </TabsList>

        {!hideVendas && (
          <TabsContent value="encomendas">
            <EncomendasFinanceiro showCompleted={showInactive} />
          </TabsContent>
        )}

        {!hideCompras && (
          <TabsContent value="pagar">
            <ContasPagar contas={[]} />
          </TabsContent>
        )}

        {!hideFaturas && (
          <TabsContent value="faturas">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
