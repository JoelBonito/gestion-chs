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
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
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
      }));

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar encomendas",
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
  const totalReceber = encomendas.reduce((sum, e) => sum + e.saldo_devedor, 0);
  const totalPago = encomendas.reduce((sum, e) => sum + e.valor_pago, 0);
  const totalGeral = encomendas.reduce((sum, e) => sum + e.valor_total, 0);

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
          title="Total Geral"
          value={`€${totalGeral.toFixed(2)}`}
          subtitle="Valor total das encomendas"
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
        
        <StatCard
          title="Total Pago"
          value={`€${totalPago.toFixed(2)}`}
          subtitle="Pagamentos recebidos"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="A Receber"
          value={`€${totalReceber.toFixed(2)}`}
          subtitle="Pendente de recebimento"
          icon={<TrendingDown className="h-6 w-6" />}
          variant="warning"
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
                entityId="financial-docs" // Using a fixed ID for financial documents
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
