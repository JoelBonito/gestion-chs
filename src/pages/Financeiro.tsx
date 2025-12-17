import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro"; // Vendas
import ContasPagar from "@/components/ContasPagar";                 // Compras
import Invoices from "@/components/Invoices";                       // Faturas
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

type TabKey = "encomendas" | "pagar" | "faturas";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<TabKey>("encomendas");
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
    <PageContainer
      title="Financeiro"
      subtitle="Gestão completa de fluxo de caixa e faturas"
    >
      {/* Cards de resumo - escondidos para ham@admin.com e felipe@colaborador.com */}
      {!isHam && !isFelipe && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {loadingResumo ? (
            [1, 2, 3].map(i => <GlassCard key={i} className="h-32 animate-pulse bg-muted/20"><div /></GlassCard>)
          ) : (
            <>
              <GlassCard className="p-6 relative overflow-hidden group hover:border-success/30 transition-all">
                <div className="flex flex-col gap-1 z-10 relative">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    {t("Total a Receber")}
                  </span>
                  <span className="text-3xl font-bold text-foreground tracking-tight">
                    {formatCurrencyEUR(resumo.a_receber)}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="h-16 w-16" />
                </div>
              </GlassCard>

              <GlassCard className="p-6 relative overflow-hidden group hover:border-destructive/30 transition-all">
                <div className="flex flex-col gap-1 z-10 relative">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    {t("Total a Pagar")}
                  </span>
                  <span className="text-3xl font-bold text-foreground tracking-tight">
                    {formatCurrencyEUR(resumo.a_pagar)}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingDown className="h-16 w-16" />
                </div>
              </GlassCard>

              <GlassCard className="p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="flex flex-col gap-1 z-10 relative">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    {t("Saldo Atual")}
                  </span>
                  <span className={`text-3xl font-bold tracking-tight ${resumo.saldo >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrencyEUR(resumo.saldo)}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wallet className="h-16 w-16" />
                </div>
              </GlassCard>
            </>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)} className="space-y-6">
        <TabsList className="bg-background/40 p-1 border border-border/40 backdrop-blur-sm h-12 rounded-xl">
          {!hideVendas && <TabsTrigger value="encomendas" className="rounded-lg h-10 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">{t("Vendas")}</TabsTrigger>}
          {!hideCompras && <TabsTrigger value="pagar" className="rounded-lg h-10 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">{t("Compras")}</TabsTrigger>}
          {!hideFaturas && <TabsTrigger value="faturas" className="rounded-lg h-10 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">{t("Faturas")}</TabsTrigger>}
        </TabsList>

        {!hideVendas && (
          <TabsContent value="encomendas" className="mt-0">
            <EncomendasFinanceiro showCompleted={false} />
          </TabsContent>
        )}

        {!hideCompras && (
          <TabsContent value="pagar" className="mt-0">
            <ContasPagar />
          </TabsContent>
        )}

        {!hideFaturas && (
          <TabsContent value="faturas" className="mt-0">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}
