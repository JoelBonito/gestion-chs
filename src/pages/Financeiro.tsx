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
import { AttachmentManager } from "@/components/AttachmentManager";
import type { EncomendaFinanceiro } from "@/types/financeiro";

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
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const { toast } = useToast();

  const fetchEncomendas = async () => {
    try {
      // Buscar encomendas a receber (saldo devedor > 0)
      const { data: encomendasData, error: encomendasError } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes!inner(nome),
          frete_encomenda(valor_frete)
        `)
        .gt("saldo_devedor", 0)
        .order("created_at", { ascending: false });

      if (encomendasError) throw encomendasError;

      const encomendasFormatadas: EncomendaFinanceiro[] = encomendasData.map((e: any) => {
        const produtos = parseFloat(e.valor_total ?? 0);
        const frete = parseFloat(e.frete_encomenda?.[0]?.valor_frete ?? 0);
        const pago = parseFloat(e.valor_pago ?? 0);
        const totalCaixa = produtos + frete; // Total a receber do cliente
        
        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          cliente_nome: e.clientes?.nome ?? '',
          valor_total: produtos,
          valor_pago: pago,
          saldo_devedor: Math.max(produtos - pago, 0),
          valor_frete: frete,
          total_caixa: totalCaixa,
          saldo_devedor_caixa: Math.max(totalCaixa - pago, 0),
        };
      });

      // Buscar contas a pagar (saldo devedor fornecedor > 0)
      const { data: contasData, error: contasError } = await supabase
        .from("encomendas")
        .select(`
          *,
          fornecedores!inner(nome),
          frete_encomenda(valor_frete)
        `)
        .gt("saldo_devedor_fornecedor", 0)
        .order("created_at", { ascending: false });

      if (contasError) throw contasError;

      const contasFormatadas = contasData.map((e: any) => {
        const custoTotal = parseFloat(e.valor_total_custo ?? 0);
        const frete = parseFloat(e.frete_encomenda?.[0]?.valor_frete ?? 0);
        const pagoFornecedor = parseFloat(e.valor_pago_fornecedor ?? 0);
        const totalFornecedor = custoTotal + frete; // Total a pagar ao fornecedor
        
        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          fornecedor_nome: e.fornecedores?.nome ?? '',
          valor_total_custo: custoTotal,
          valor_pago_fornecedor: pagoFornecedor,
          saldo_devedor_fornecedor: Math.max(custoTotal - pagoFornecedor, 0),
          valor_frete: frete,
          total_fornecedor: totalFornecedor,
          saldo_devedor_fornecedor_total: Math.max(totalFornecedor - pagoFornecedor, 0),
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
    fetchEncomendas();
  }, []);

  const handlePagamentoSuccess = () => {
    setShowPagamentoDialog(false);
    fetchEncomendas();
  };

  // Cálculos para o resumo
  const totalReceber = encomendas.reduce((sum, e) => sum + (e.saldo_devedor_caixa ?? 0), 0);
  const totalPagar = contasPagar.reduce((sum, c) => sum + (c.saldo_devedor_fornecedor_total ?? 0), 0);
  const totalCaixa = encomendas.reduce((sum, e) => sum + (e.total_caixa ?? 0), 0);

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
                encomendas={encomendas}
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
          subtitle="Pendente de clientes"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="A Pagar"
          value={`€${totalPagar.toFixed(2)}`}
          subtitle="Pendente a fornecedores"
          icon={<TrendingDown className="h-6 w-6" />}
          variant="warning"
        />
        
        <StatCard
          title="Total Cliente"
          value={`€${totalCaixa.toFixed(2)}`}
          subtitle="Valor total (produtos + frete)"
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="encomendas">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          <TabsTrigger value="anexos">Anexos</TabsTrigger>
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

        <TabsContent value="encomendas">
          <EncomendasFinanceiro />
        </TabsContent>

        <TabsContent value="pagar">
          <ContasPagar />
        </TabsContent>

        <TabsContent value="anexos">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Documentos Financeiros</CardTitle>
              <CardDescription>
                Gerencie documentos e comprovantes relacionados ao financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttachmentManager 
                entityType="financeiro" 
                entityId="financial-docs"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
