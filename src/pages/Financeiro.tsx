import { useEffect, useState, useMemo } from "react";
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
  const [activeTab, setActiveTab] = useState<TabKey>("resumo");
  const [showInactive, setShowInactive] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Totais dos cards
  const [loadingTotals, setLoadingTotals] = useState<boolean>(true);
  const [totalReceber, setTotalReceber] = useState<number>(0);
  const [totalPagar, setTotalPagar] = useState<number>(0);

  const email = (userEmail ?? "").toLowerCase();

  const isHam = email === "ham@admin.com";
  const isFelipe = email === "felipe@colaborador.com";
  const isAdminDash = email === "jbento1@admin.com" || email === "admin@admin.com";

  // i18n básico para rótulos desta página (FR só para Ham, como antes)
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

  // pega usuário e define tab padrão por perfil
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const mail = data?.user?.email ?? null;
      setUserEmail(mail);

      const m = (mail ?? "").toLowerCase();
      if (m === "ham@admin.com") {
        setActiveTab("encomendas");   // Vendas
      } else if (m === "felipe@colaborador.com") {
        setActiveTab("pagar");        // Compras
      } else if (m === "jbento1@admin.com" || m === "admin@admin.com") {
        setActiveTab("encomendas");   // Admins: sem "Resumo", abre em Vendas
      } else {
        setActiveTab("resumo");
      }
    })();
  }, []);

  // regras de visibilidade (inalteradas para Ham/Felipe; Admins veem tudo, sem Resumo)
  const hideResumo = isHam || isFelipe || isAdminDash;
  const hideVendas = isFelipe; // Felipe não vê Vendas
  const hideCompras = isHam;   // Ham não vê Compras
  const hideFaturas = isFelipe; // Felipe não vê Faturas (mantido)

  // corrigir caso usuário caia por URL em aba oculta
  useEffect(() => {
    if (isHam && (activeTab === "resumo" || activeTab === "pagar")) {
      setActiveTab("encomendas");
    }
    if (isFelipe && (activeTab === "resumo" || activeTab === "encomendas" || activeTab === "faturas")) {
      setActiveTab("pagar");
    }
    if (isAdminDash && activeTab === "resumo") {
      setActiveTab("encomendas");
    }
  }, [isHam, isFelipe, isAdminDash, activeTab]);

  // Carrega os totais dos cards (sempre que soubermos o usuário)
  useEffect(() => {
    if (!userEmail) return;
    fetchTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const fetchTotals = async () => {
    try {
      setLoadingTotals(true);

      // Total a Receber: soma dos saldos de clientes (saldo_devedor > 0)
      const { data: recData, error: recErr } = await supabase
        .from("encomendas")
        .select("saldo_devedor")
        .gt("saldo_devedor", 0);
      if (recErr) throw recErr;
      const receber = (recData ?? []).reduce((acc: number, r: any) => acc + Number(r.saldo_devedor || 0), 0);

      // Total a Pagar: soma dos saldos de fornecedores (saldo_devedor_fornecedor > 0)
      const { data: payData, error: payErr } = await supabase
        .from("encomendas")
        .select("saldo_devedor_fornecedor")
        .gt("saldo_devedor_fornecedor", 0);
      if (payErr) throw payErr;
      const pagar = (payData ?? []).reduce((acc: number, r: any) => acc + Number(r.saldo_devedor_fornecedor || 0), 0);

      setTotalReceber(receber);
      setTotalPagar(pagar);
    } catch (e) {
      // silencioso para não poluir UI; se quiser, adicionar toast aqui
      setTotalReceber(0);
      setTotalPagar(0);
    } finally {
      setLoadingTotals(false);
    }
  };

  const saldoAtual = useMemo(() => totalReceber - totalPagar, [totalReceber, totalPagar]);

  // Render dos cards (reutilizado)
  const CardsResumo = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("Total a Receber")}</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loadingTotals ? "—" : formatCurrencyEUR(totalReceber)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("Total a Pagar")}</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loadingTotals ? "—" : formatCurrencyEUR(totalPagar)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("Saldo Atual")}</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-bold">
          {loadingTotals ? "—" : formatCurrencyEUR(saldoAtual)}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="px-4 md:px-8">
      {/* Para os admins (jbento1/admin), os cards aparecem SEMPRE no topo */}
      {isAdminDash && <CardsResumo />}

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideResumo && <TabsTrigger value="resumo">{t("Resumo")}</TabsTrigger>}
          {!hideVendas && <TabsTrigger value="encomendas">{t("Vendas")}</TabsTrigger>}
          {!hideCompras && <TabsTrigger value="pagar">{t("Compras")}</TabsTrigger>}
          {!hideFaturas && <TabsTrigger value="faturas">{t("Faturas")}</TabsTrigger>}
        </TabsList>

        {/* Resumo (somente para quem não é Ham/Felipe/Admin) */}
        {!hideResumo && (
          <TabsContent value="resumo">
            {/* Aqui ficam os cards para perfis "comuns" */}
            <CardsResumo />
          </TabsContent>
        )}

        {/* Vendas */}
        {!hideVendas && (
          <TabsContent value="encomendas">
            {/* Para admins, já exibimos os cards no topo; abaixo vem o conteúdo de Vendas */}
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
            <ContasPagar />
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
