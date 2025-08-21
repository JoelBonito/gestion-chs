import { useState } from "react";
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";

// Mock data
const contasReceber = [
  {
    id: "REC-001",
    cliente: "Distribuidora Alpha",
    valor: 2500.00,
    dataVencimento: "2024-01-20",
    status: "pendente",
    diasVencimento: 5,
    descricao: "Encomenda ENV-001"
  },
  {
    id: "REC-002",
    cliente: "Beauty Gamma",
    valor: 3200.00,
    dataVencimento: "2024-01-10",
    status: "vencido",
    diasVencimento: -11,
    descricao: "Encomenda ENV-003"
  },
  {
    id: "REC-003",
    cliente: "Hair Delta",
    valor: 950.00,
    dataVencimento: "2024-01-25",
    status: "pendente",
    diasVencimento: 10,
    descricao: "Encomenda ENV-004"
  }
];

const contasPagar = [
  {
    id: "PAG-001",
    fornecedor: "Fábrica Premium Hair",
    valor: 1800.00,
    dataVencimento: "2024-01-18",
    status: "pendente",
    diasVencimento: 3,
    descricao: "Produtos Encomenda ENV-001"
  },
  {
    id: "PAG-002",
    fornecedor: "Indústria Capilar Pro",
    valor: 1200.00,
    dataVencimento: "2024-01-22",
    status: "pendente",
    diasVencimento: 7,
    descricao: "Produtos Encomenda ENV-002"
  }
];

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

  const getStatusBadge = (status: string, diasVencimento: number) => {
    if (status === "vencido") {
      return { label: "Vencido", variant: "destructive" as const };
    }
    if (diasVencimento <= 3) {
      return { label: "Vence em breve", variant: "outline" as const };
    }
    return { label: "Pendente", variant: "secondary" as const };
  };

  const totalReceber = contasReceber.reduce((sum, conta) => sum + conta.valor, 0);
  const totalPagar = contasPagar.reduce((sum, conta) => sum + conta.valor, 0);
  const saldoLiquido = totalReceber - totalPagar;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro do seu negócio</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Financial Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="A Receber"
          value={`R$ ${totalReceber.toFixed(2)}`}
          subtitle="3 contas pendentes"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="A Pagar"
          value={`R$ ${totalPagar.toFixed(2)}`}
          subtitle="2 contas pendentes"
          icon={<TrendingDown className="h-6 w-6" />}
          variant="warning"
        />
        
        <StatCard
          title="Saldo Projetado"
          value={`R$ ${saldoLiquido.toFixed(2)}`}
          subtitle={saldoLiquido > 0 ? "Positivo" : "Negativo"}
          icon={<DollarSign className="h-6 w-6" />}
          variant={saldoLiquido > 0 ? "success" : "destructive"}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
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
                        {mov.valor > 0 ? '+' : ''}R$ {Math.abs(mov.valor).toFixed(2)}
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
                  <div className="flex items-start p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Conta vencida</p>
                      <p className="text-xs text-muted-foreground">Beauty Gamma - R$ 3.200,00 (11 dias)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-warning mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Vencimento próximo</p>
                      <p className="text-xs text-muted-foreground">Fábrica Premium Hair - R$ 1.800,00 (3 dias)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receber" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>Valores pendentes dos clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contasReceber.map((conta) => {
                  const status = getStatusBadge(conta.status, conta.diasVencimento);
                  return (
                    <div key={conta.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{conta.cliente}</p>
                        <p className="text-sm text-muted-foreground">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {conta.dataVencimento}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold">R$ {conta.valor.toFixed(2)}</p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Valores pendentes para fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contasPagar.map((conta) => {
                  const status = getStatusBadge(conta.status, conta.diasVencimento);
                  return (
                    <div key={conta.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{conta.fornecedor}</p>
                        <p className="text-sm text-muted-foreground">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {conta.dataVencimento}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold text-destructive">R$ {conta.valor.toFixed(2)}</p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}