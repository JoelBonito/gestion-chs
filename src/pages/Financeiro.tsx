import { useState, useEffect } from "react";
import { Download, TrendingUp, TrendingDown, DollarSign, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import StatCard from "@/components/StatCard";
import PagamentoForm from "@/components/PagamentoForm";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro";
import ContasPagar from "@/components/ContasPagar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EncomendaFinanceiro, ContaPagar } from "@/types/financeiro";

// Mock data para movimentações
const movimentacoes = [
  {
    id: "MOV-001",
    tipo: "recebimento",
    descricao: "Pagamento Beauty Gamma",
    valor: 3200.00,
    data: "2024-01-13",
    categoria: "Vendas"
  },
  {
    id: "MOV-002",
    tipo: "pagamento",
    descricao: "Pagamento Fábrica Premium Hair",
    valor: -1500.00,
    data: "2024-01-12",
    categoria: "Fornecedores"
  },
  {
    id: "MOV-003",
    tipo: "recebimento",
    descricao: "Pagamento Cosméticos Beta",
    valor: 1800.00,
    data: "2024-01-11",
    categoria: "Vendas"
  }
];

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("resumo");
  const [encomendas, setEncomendas] = useState<EncomendaFinanceiro[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const { toast } = useToast();

  const fetchDadosFinanceiros = async () => {
    try {
      // Buscar encomendas a receber
      const { data: encomendasData, error: encomendasError } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total,
          valor_pago,
          valor_frete,
          clientes(id, nome)
        `)
        .order("created_at", { ascending: false });

      if (encomendasError) throw encomendasError;

      const encomendasFormatadas: EncomendaFinanceiro[] = (encomendasData ?? []).map((e: any) => {
        const valorProdutos = Number(e.valor_total ?? 0);
        const valorFrete = Number(e.valor_frete ?? 0);
        const valorPago = Number(e.valor_pago ?? 0);
        
        // A RECEBER = Valor dos produtos + Valor do frete
        const totalCaixa = valorProdutos + valorFrete;
        const saldoDevedorCaixa = Math.max(totalCaixa - valorPago, 0);

        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          cliente_nome: e.clientes?.nome ?? "",
          valor_total: valorProdutos,
          valor_pago: valorPago,
          saldo_devedor: Math.max(valorProdutos - valorPago, 0),
          valor_frete: valorFrete,
          total_caixa: totalCaixa,
          saldo_devedor_caixa: saldoDevedorCaixa,
        };
      });

      // Buscar contas a pagar
      const { data: contasData, error: contasError } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total_custo,
          valor_pago_fornecedor,
          valor_frete,
          fornecedores(id, nome)
        `)
        .order("created_at", { ascending: false });

      if (contasError) throw contasError;

      const contasFormatadas: ContaPagar[] = (contasData ?? []).map((e: any) => {
        const valorCusto = Number(e.valor_total_custo ?? 0);
        const valorFrete = Number(e.valor_frete ?? 0);
        const valorPagoFornecedor = Number(e.valor_pago_fornecedor ?? 0);
        
        // A PAGAR = Valor do custo + Valor do frete
        const totalFornecedor = valorCusto + valorFrete;
        const saldoDevedorTotal = Math.max(totalFornecedor - valorPagoFornecedor, 0);
        
        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          fornecedor_nome: e.fornecedores?.nome ?? '',
          valor_total_custo: valorCusto,
          valor_pago_fornecedor: valorPagoFornecedor,
          saldo_devedor_fornecedor: Math.max(valorCusto - valorPagoFornecedor, 0),
          valor_frete: valorFrete,
          total_fornecedor: totalFornecedor,
          saldo_devedor_fornecedor_total: saldoDevedorTotal,
        };
      });

      setEncomendas(encomendasFormatadas);
      setContasPagar(contasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados financeiros",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDadosFinanceiros();
  }, []);

  const handlePagamentoSuccess = () => {
    setShowPagamentoDialog(false);
    fetchDadosFinanceiros();
  };

  // Cálculos para o resumo - KPIs de receita usam apenas valor_total (produtos)
  const totalReceber = encomendas.reduce((sum, e) => sum + e.saldo_devedor_caixa, 0); // Produtos + Frete - Pago
  const totalPagar = contasPagar.reduce((sum, c) => sum + c.saldo_devedor_fornecedor_total, 0); // Custo + Frete - Pago
  const totalReceita = encomendas.reduce((sum, e) => sum + e.valor_total, 0); // Apenas produtos para KPI
  
  // Count orders with pending balances
  const encomendasPendentes = encomendas.filter(e => e.saldo_devedor_caixa > 0).length;
  const contasPendentes = contasPagar.filter(c => c.saldo_devedor_fornecedor_total > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showPagamentoDialog} onOpenChange={setShowPagamentoDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Lançar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <PagamentoForm 
                onSuccess={handlePagamentoSuccess}
                encomendas={encomendas.filter(e => e.saldo_devedor_caixa > 0)}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="A Receber"
          value={`€${totalReceber.toFixed(2)}`}
          subtitle={`${encomendasPendentes} encomendas pendentes (produtos + frete)`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="A Pagar"
          value={`€${totalPagar.toFixed(2)}`}
          subtitle={`${contasPendentes} contas pendentes (custo + frete)`}
          icon={<TrendingDown className="h-6 w-6" />}
          variant="warning"
        />
        
        <StatCard
          title="Receita Produtos"
          value={`€${totalReceita.toFixed(2)}`}
          subtitle={`${encomendas.length} encomendas (valor total dos produtos)`}
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="encomendas">
            A Receber 
            {encomendasPendentes > 0 && (
              <Badge variant="secondary" className="ml-2">{encomendasPendentes}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagar">
            A Pagar
            {contasPendentes > 0 && (
              <Badge variant="secondary" className="ml-2">{contasPendentes}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

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
                  {encomendasPendentes > 0 && (
                    <div className="flex items-start p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-warning mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Pagamentos pendentes de clientes</p>
                        <p className="text-xs text-muted-foreground">{encomendasPendentes} encomendas com saldo devedor</p>
                      </div>
                    </div>
                  )}
                  {contasPendentes > 0 && (
                    <div className="flex items-start p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Pagamentos pendentes a fornecedores</p>
                        <p className="text-xs text-muted-foreground">{contasPendentes} contas a pagar</p>
                      </div>
                    </div>
                  )}
                  {encomendasPendentes === 0 && contasPendentes === 0 && (
                    <div className="flex items-start p-3 bg-success/10 border border-success/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-success mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Situação financeira em dia</p>
                        <p className="text-xs text-muted-foreground">Não há pagamentos pendentes</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="encomendas">
          <EncomendasFinanceiro />
        </TabsContent>

        <TabsContent value="pagar">
          <ContasPagar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
