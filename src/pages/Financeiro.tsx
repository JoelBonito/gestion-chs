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

export default function Financeiro() {
  const { hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
  const { toast } = useToast();

  // 🔽 controla a sub-aba ativa
  const [activeTab, setActiveTab] = useState<"resumo" | "encomendas" | "pagar" | "faturas">("resumo");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // carrega encomendas (A Receber)
  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`*, clientes!inner(nome)`)
        .gt("saldo_devedor", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = data.map((encomenda: any) => ({
        id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        cliente_nome: encomenda.clientes.nome,
        valor_total: parseFloat(encomenda.valor_total),
        valor_pago: parseFloat(encomenda.valor_pago),
        saldo_devedor: parseFloat(encomenda.saldo_devedor),
        valor_frete: parseFloat(encomenda.valor_frete || 0),
      }));

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      console.error("Erro ao carregar encomendas financeiras:", error);
      toast({
        title: "Erro ao carregar encomendas",
        description: "Você pode não ter permissão para acessar dados financeiros",
        variant: "destructive",
      });
    }
  };

  // total a pagar (fornecedores)
  const [totalPagar, setTotalPagar] = useState<number>(0);
  const fetchTotalPagar = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("saldo_devedor_fornecedor")
        .gt("saldo_devedor_fornecedor", 0);

      if (error) throw error;

      const total = data.reduce(
        (sum: number, e: any) => sum + parseFloat(e.saldo_devedor_fornecedor || 0),
        0
      );
      setTotalPagar(total);
    } catch (error) {
      console.error("Erro ao carregar total a pagar:", error);
    }
  };

  // dados iniciais + usuário
  useEffect(() => {
    fetchEncomendas();
    fetchTotalPagar();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email?.toLowerCase() ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // define sub-aba inicial por usuário
  const isHam = userEmail === "ham@admin.com";
  const isFelipe = userEmail === "felipe@colaboardor.com";

  useEffect(() => {
    if (isHam) {
      setActiveTab("encomendas"); // A RECEBER
    } else if (isFelipe) {
      setActiveTab("pagar"); // A PAGAR
    } else if (isRestrictedFR && activeTab === "resumo") {
      setActiveTab("encomendas");
    }
    // não incluir activeTab nas deps para evitar loop de setState
  }, [isHam, isFelipe, isRestrictedFR]);

  const handleFinancialDataRefresh = () => {
    fetchEncomendas();
    fetchTotalPagar();
  };

  const totalReceber = encomendas.reduce((sum, e) => sum + e.saldo_devedor, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro do seu negócio</p>
        </div>
      </div>

      {/* 🔒 Esconde os cards de resumo para ham@admin.com */}
      {!isHam && !hasRole("factory") && !isCollaborator && (
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="space-y-4">
          <TabsList className={`grid w-full ${isRestrictedFR ? "grid-cols-2" : "grid-cols-4"}`}>
            {/* 🔒 Não mostra a tab Resumo para ham@admin.com */}
            {!isHam && !isRestrictedFR && <TabsTrigger value="resumo">Resumo</TabsTrigger>}
            <TabsTrigger value="encomendas">
              {locale === "fr-FR" ? "À recevoir" : "A Receber"}
            </TabsTrigger>
            {!isRestrictedFR && <TabsTrigger value="pagar">A Pagar</TabsTrigger>}
            <TabsTrigger value="faturas">
              {locale === "fr-FR" ? "Factures" : "Faturas"}
            </TabsTrigger>
          </TabsList>

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

        {/* Conteúdos */}
        {!isHam && !hasRole("factory") && !isCollaborator && !isRestrictedFR && (
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
                        <div className={`font-bold text-sm ${mov.valor > 0 ? 'text-success' : 'text-destructive'}`}>
                          {mov.valor > 0 ? '+' : ''}€{Math.abs(mov.valor).toFixed(2)}
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

        <TabsContent value="encomendas">
          <EncomendasFinanceiro
            onRefreshNeeded={handleFinancialDataRefresh}
            showCompleted={showCompleted}
          />
        </TabsContent>

        {!isRestrictedFR && (
          <TabsContent value="pagar">
            <ContasPagar
              onRefreshNeeded={handleFinancialDataRefresh}
              showCompleted={showCompleted}
            />
          </TabsContent>
        )}

        <TabsContent value="faturas">
          <Invoices />
        </TabsContent>
      </Tabs>
    </div>
  );
}
