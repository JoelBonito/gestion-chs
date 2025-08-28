
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro";
import ContasPagar from "@/components/ContasPagar";
import Invoices from "@/components/Invoices";
import { RoleGuard } from "@/components/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

// Mock data para movimentações
const movimentacoes: any[] = [];

export default function Financeiro() {
  const { hasRole } = useUserRole();
  const [activeTab, setActiveTab] = useState(hasRole('factory') ? "a-pagar" : "resumo");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes!inner(nome)
        `)
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
      console.error('Erro ao carregar encomendas financeiras:', error);
      toast({
        title: "Erro ao carregar encomendas",
        description: "Você pode não ter permissão para acessar dados financeiros",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  // Handler para refresh quando anexos são alterados
  const handleFinancialDataRefresh = () => {
    console.log("Financeiro - Refreshing financial data due to attachment change");
    fetchEncomendas();
  };

  // Cálculos para o resumo - apenas produtos (sem frete nos KPIs)
  const totalReceber = encomendas.reduce((sum, e) => sum + e.saldo_devedor, 0);
  const totalPago = encomendas.reduce((sum, e) => sum + e.valor_pago, 0);
  const totalGeral = encomendas.reduce((sum, e) => sum + e.valor_total, 0);

  return (
    <RoleGuard allowedRoles={['admin', 'finance', 'factory']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Controle financeiro do seu negócio</p>
          </div>
        </div>

        {/* Financial Stats - KPIs baseados apenas em produtos - Hide for factory users */}
        {!hasRole('factory') && (
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard
              title="A Pagar"
              value={`€${totalPago.toFixed(2)}`}
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
              value={`€${(totalReceber - totalPago).toFixed(2)}`}
              subtitle="Diferença entre receber e pagar"
              icon={<DollarSign className="h-6 w-6" />}
              variant="default"
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {hasRole('factory') ? (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="a-pagar">A Pagar</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="encomendas">A Receber</TabsTrigger>
              <TabsTrigger value="pagar">A Pagar</TabsTrigger>
              <TabsTrigger value="faturas">Faturas</TabsTrigger>
            </TabsList>
          )}

          {!hasRole('factory') && (
            <TabsContent value="resumo" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Movements */}
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

                {/* Alerts */}
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

          {!hasRole('factory') && (
            <TabsContent value="encomendas">
              <EncomendasFinanceiro onRefreshNeeded={handleFinancialDataRefresh} />
            </TabsContent>
          )}

          <TabsContent value={hasRole('factory') ? "a-pagar" : "pagar"}>
            <ContasPagar onRefreshNeeded={handleFinancialDataRefresh} />
          </TabsContent>

          {!hasRole('factory') && (
            <TabsContent value="faturas">
              <Invoices />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </RoleGuard>
  );
}
