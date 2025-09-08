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

type TabKey = "resumo" | "encomendas" | "pagar" | "faturas";

export default function Financeiro() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [allowedSupplierIds, setAllowedSupplierIds] = useState<string[] | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("resumo");
  const [showInactive, setShowInactive] = useState(false);

  const isHam = (userEmail?.toLowerCase() ?? "") === "ham@admin.com";
  const isFelipe = (userEmail?.toLowerCase() ?? "") === "felipe@colaborador.com";

  // i18n básico para rótulos desta página
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      Resumo: { pt: "Resumo", fr: "Résumé" },
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
        setActiveTab("encomendas"); // Vendas
      } else if (email?.toLowerCase() === "felipe@colaborador.com") {
      setActiveTab("pagar");
      setAllowedSupplierIds([
        "f0920a27-752c-4483-ba02-e7f32beceef6",
        "b8f995d2-47dc-4c8f-9779-ce21431f5244",
      ]); // Compras
      } else {
      setActiveTab("resumo");
      setAllowedSupplierIds(null);
      setAllowedSupplierIds(null);
      }
    })();
  }, []);

  // regras de visibilidade
  const hideResumo = isHam || isFelipe;
  const hideVendas = isFelipe;
  const hideCompras = isHam;
  const hideFaturas = isFelipe; // agora felipe não vê Faturas

  // se o usuário cair em aba oculta (via URL), corrige
  useEffect(() => {
    if (isHam && (activeTab === "resumo" || activeTab === "pagar")) {
      setActiveTab("encomendas");
    }
    if (isFelipe && (activeTab === "resumo" || activeTab === "encomendas" || activeTab === "faturas")) {
      setActiveTab("pagar");
    }
  }, [isHam, isFelipe, activeTab]);

  // mock resumo
  const resumo = { a_receber: 0, a_pagar: 0, saldo: 0 };
  const loadingResumo = false;

  return (
    <div className="px-4 md:px-8">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideResumo && <TabsTrigger value="resumo">{t("Resumo")}</TabsTrigger>}
          {!hideVendas && <TabsTrigger value="encomendas">{t("Vendas")}</TabsTrigger>}
          {!hideCompras && <TabsTrigger value="pagar">{t("Compras")}</TabsTrigger>}
          {!hideFaturas && <TabsTrigger value="faturas">{t("Faturas")}</TabsTrigger>}
        </TabsList>

        {/* Resumo */}
        {!hideResumo && (
          <TabsContent value="resumo">
            {loadingResumo ? (
              <p className="text-muted-foreground">{t("Carregando resumo...")}</p>
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
          </TabsContent>
        )}

        {/* Vendas */}
        {!hideVendas && (
          <TabsContent value="encomendas">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="showInactive"
                checked={showInactive}
                onCheckedChange={() => setShowInactive(!showInactive)}
              />
              <Label htmlFor="showInactive">{t("Mostrar inativos")}</Label>
            </div>
            <EncomendasFinanceiro showCompleted={showInactive} />
          </TabsContent>
        )}

        {/* Compras */}
        {!hideCompras && (
          <TabsContent value="pagar">
            <ContasPagar allowedSupplierIds={allowedSupplierIds} />
          </TabsContent>
        )}

        {/* Faturas */}
        {!hideFaturas && (
          <TabsContent value="faturas">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}