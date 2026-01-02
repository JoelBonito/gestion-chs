import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { EncomendasFinanceiro, ContasPagar, Invoices } from "@/components/financeiro";
import { PageContainer, GlassCard } from "@/components/shared";
import { useFinanceiroTranslation } from "@/hooks/useFinanceiroTranslation";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

type TabKey = "encomendas" | "pagar" | "faturas";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<TabKey>("encomendas");
  const { t, isHam, isFelipe } = useFinanceiroTranslation();
  const [resumo, setResumo] = useState({ a_receber: 0, a_pagar: 0, saldo: 0 });
  const [loadingResumo, setLoadingResumo] = useState(true);

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

  // pega usuário e define tab padrão
  useEffect(() => {
    if (isHam) {
      setActiveTab("encomendas");
    } else if (isFelipe) {
      setActiveTab("pagar");
    }
  }, [isHam, isFelipe]);

  // regras de visibilidade
  const hideVendas = isFelipe;
  const hideCompras = isHam;
  const hideFaturas = isFelipe;

  return (
    <PageContainer
      title={t("Financeiro")}
      subtitle={t("Gestão completa de fluxo de caixa e faturas")}
    >
      {/* Cards de resumo - escondidos para ham@admin.com e felipe@colaborador.com */}
      {!isHam && !isFelipe && (
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loadingResumo ? (
            [1, 2, 3].map((i) => (
              <GlassCard key={i} className="bg-muted/20 h-32 animate-pulse">
                <div />
              </GlassCard>
            ))
          ) : (
            <>
              <GlassCard className="group hover:border-success/30 relative overflow-hidden p-6 transition-all">
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="text-success h-4 w-4" />
                    {t("Total a Receber")}
                  </span>
                  <span className="text-foreground text-3xl font-bold tracking-tight">
                    {formatCurrencyEUR(resumo.a_receber)}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <TrendingUp className="h-16 w-16" />
                </div>
              </GlassCard>

              <GlassCard className="group hover:border-destructive/30 relative overflow-hidden p-6 transition-all">
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <TrendingDown className="text-destructive h-4 w-4" />
                    {t("Total a Pagar")}
                  </span>
                  <span className="text-foreground text-3xl font-bold tracking-tight">
                    {formatCurrencyEUR(resumo.a_pagar)}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <TrendingDown className="h-16 w-16" />
                </div>
              </GlassCard>

              <GlassCard className="group hover:border-primary/30 relative overflow-hidden p-6 transition-all">
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <Wallet className="text-primary h-4 w-4" />
                    {t("Saldo Atual")}
                  </span>
                  <span
                    className={`text-3xl font-bold tracking-tight ${resumo.saldo >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    {formatCurrencyEUR(resumo.saldo)}
                  </span>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <Wallet className="h-16 w-16" />
                </div>
              </GlassCard>
            </>
          )}
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as TabKey)}
        className="space-y-6"
      >
        <TabsList className="border-border/40 h-auto w-full justify-start gap-8 rounded-none border-b bg-transparent p-0">
          {!hideVendas && (
            <TabsTrigger
              value="encomendas"
              className="data-[state=active]:border-primary data-[state=active]:text-primary hover:text-primary/80 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 font-semibold transition-all data-[state=active]:bg-transparent"
            >
              {t("Vendas")}
            </TabsTrigger>
          )}
          {!hideCompras && (
            <TabsTrigger
              value="pagar"
              className="data-[state=active]:border-primary data-[state=active]:text-primary hover:text-primary/80 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 font-semibold transition-all data-[state=active]:bg-transparent"
            >
              {t("Compras")}
            </TabsTrigger>
          )}
          {!hideFaturas && (
            <TabsTrigger
              value="faturas"
              className="data-[state=active]:border-primary data-[state=active]:text-primary hover:text-primary/80 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-4 font-semibold transition-all data-[state=active]:bg-transparent"
            >
              {t("Faturas")}
            </TabsTrigger>
          )}
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
