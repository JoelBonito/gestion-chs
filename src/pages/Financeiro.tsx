import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/StatCard";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro";
import ContasPagar from "@/components/ContasPagar";
import Invoices from "@/components/Invoices";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";

const movimentacoes: any[] = [];

type TabKey = "resumo" | "encomendas" | "pagar" | "faturas";

export default function Financeiro() {
  const { hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("resumo");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ===== DATA =====
  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`*, clientes!inner(nome)`)
        .gt("saldo_devedor", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data ?? []).map((e: any) => ({
        id: e.id,
        numero_encomenda: e.numero_encomenda,
        cliente_nome: e.clientes.nome,
        valor_total: parseFloat(e.valor_total),
        valor_pago: parseFloat(e.valor_pago),
        saldo_devedor: parseFloat(e.saldo_devedor),
        valor_frete: parseFloat(e.valor_frete || 0),
      }));

      setEncomendas(list);
    } catch (error: any) {
      console.error("Erro ao carregar encomendas financeiras:", error);
      toast({
        title: "Erro ao carregar encomendas",
        description: "Você pode não ter permissão para acessar dados financeiros",
        variant: "destructive",
      });
    }
  };

  const [totalPagar, setTotalPagar] = useState<number>(0);
  const fetchTotalPagar = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("saldo_devedor_fornecedor")
        .gt("saldo_devedor_fornecedor", 0);

      if (error) throw error;

      const total = (data ?? []).reduce(
        (sum: number, e: any) => sum + parseFloat(e.saldo_devedor_fornecedor || 0),
        0
      );
      setTotalPagar(total);
    } catch (error) {
      console.error("Erro ao carregar total a pagar:", error);
    }
  };

  useEffect(() => {
    fetchEncomendas();
    fetchTotalPagar();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email?.toLowerCase() ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalReceber = encomendas.reduce((sum, e) => sum + e.saldo_devedor, 0);

  // ===== REGRAS DE EXIBIÇÃO POR USUÁRIO =====
  const isHam = userEmail === "ham@admin.com";
  const isFelipe = userEmail === "felipe@colaborador.com";

  // Define aba inicial assim que souber o usuário (e aplica fallback para FR)
  useEffect(() => {
    if (isFelipe) {
      setActiveTab("pagar");        // Felipe: A PAGAR
    } else if (isHam) {
      setActiveTab("encomendas");   // Ham: A RECEBER
    } else if (isRestrictedFR && activeTab === "resumo") {
      setActiveTab("encomendas");   // Inquilinos FR não têm "resumo" por padrão
    }
    // não inclua activeTab para evitar loop
  }, [isHam, isFelipe, isRestrictedFR]);

  // Quais abas mostrar?
  let showResumo = false;
  let showEncomendas = false;
  let showPagar = false;
  let showFaturas = false;

  if (isFelipe) {
    // Apenas A Pagar
    showPagar = true;
  } else if (isHam) {
    // A Receber + Faturas
    showEncomendas = true;
    showFaturas = true;
  } else {
    // Demais usuários → regra anterior
    showResumo = !isRestrictedFR;
    showEncomendas = true;
    showPagar = !isRestrictedFR;
    showFaturas = true;
  }

  const visibleTabsCount = [showResumo, showEncomendas, showPagar, showFaturas].filter(Boolean).length;
  const gridCols = `grid-cols-${Math.max(1, visibleTabsCount)}`;

  // Cards de resumo visíveis só para quem não é Ham nem Felipe e não é factory/collaborator
  const showSummaryCards = !isHam && !isFelipe && !hasRole("factory") && !isCollaborator;

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro do seu negócio</p>
        </div>
      </div>

      {showSummaryCards && (
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="A Pagar"
            value={`€${totalPagar.toFixed(2)}`}
            subtitle="Total a pagar a fornecedores"
            icon={<TrendingDown className="h-6 w-6" />}
            variant="warning"
          />
          <StatCard
            title="A Receber"
            value={`€${totalReceber.toFixed(2)}`}
            subtitle="Pendente de recebimento"
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <StatCard
            title="Total Geral"
            value={`€${(totalReceber - totalPagar).toFixed(2)}`}
            subtitle="Diferença entre receber e pagar"
            icon={<DollarSign className="h-6 w-6" />}
            variant="default"
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="space-y-4">
          <TabsList className={`grid w-full ${gridCols}`}>
            {showResumo && <TabsTrigger value="resumo">Resumo</TabsTrigger>}
            {showEncomendas && (
              <TabsTrigger value="encomendas">
                {locale === "fr-FR" ? "À recevoir" : "A Receber"}
              </TabsTrigger>
            )}
            {showPagar && <TabsTrigger value="pagar">A Pagar</TabsTrigger>}
            {showFaturas && (
              <TabsTrigger value="faturas">
                {locale === "fr-FR" ? "Factures" : "Faturas"}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Filtro "Mostrar concluídos" continua disponível */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label htmlFor="show-completed">Mostrar Concluídos</Label>
            </div>
          </div>
        </div>

        {showResumo && (
          <TabsContent value="resumo" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Movimentações Recentes</CardTitle>
                  <CardDescription>Últimas transações financeiras</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {movimentacoes.map((mov) => (
                      <div key={mov.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{mov.descricao}</p>
                          <p className="text-xs text-muted-foreground">{mov.data} • {mov.categoria}</p>
                        </div>
                        <div className={`font-bold text-sm ${mov.valor > 0 ? "text-success" : "text-destructive"}`}>
                          {mov.valor > 0 ? "+" : ""}€{Math.abs(mov.valor).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Alertas Financeiros</CardTitle>
                  <CardDescription>Itens que precisam de atenção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-warning mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Pagamentos pendentes</p>
                        <p className="text-xs text-muted-foreground">{encomendas.length} encomendas com saldo devedor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {showEncomendas && (
          <TabsContent value="encomendas">
            <EncomendasFinanceiro
              onRefreshNeeded={fetchEncomendas}
              showCompleted={showCompleted}
            />
          </TabsContent>
        )}

        {showPagar && (
          <TabsContent value="pagar">
            <ContasPagar
              onRefreshNeeded={fetchTotalPagar}
              showCompleted={showCompleted}
            />
          </TabsContent>
        )}

        {showFaturas && (
          <TabsContent value="faturas">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
