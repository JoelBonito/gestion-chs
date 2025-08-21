import { Package, DollarSign, TrendingUp, Users, AlertCircle, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Mock data
const recentOrders = [
  { id: "ENV-001", client: "Distribuidora Alpha", value: 2500.00, status: "pending", date: "2024-01-15" },
  { id: "ENV-002", client: "Cosméticos Beta", value: 1800.00, status: "sent", date: "2024-01-14" },
  { id: "ENV-003", client: "Beauty Gamma", value: 3200.00, status: "delivered", date: "2024-01-13" },
  { id: "ENV-004", client: "Hair Delta", value: 950.00, status: "pending", date: "2024-01-12" },
];

const pendingPayments = [
  { client: "Distribuidora Alpha", amount: 2500.00, dueDate: "2024-01-20", overdue: false },
  { client: "Beauty Gamma", amount: 3200.00, dueDate: "2024-01-10", overdue: true },
  { client: "Hair Delta", amount: 950.00, dueDate: "2024-01-25", overdue: false },
];

export default function Dashboard() {
  // Calculate monthly commissions
  const { data: monthlyCommissions } = useQuery({
    queryKey: ['monthly-commissions'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          id,
          data_criacao,
          itens_encomenda (
            quantidade,
            preco_unitario,
            produtos (
              preco_custo
            )
          )
        `)
        .gte('data_criacao', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('data_criacao', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) return 0;
      
      let totalCommission = 0;
      data?.forEach(encomenda => {
        encomenda.itens_encomenda?.forEach(item => {
          if (item.produtos && item.preco_unitario && item.produtos.preco_custo) {
            const profit = (item.preco_unitario - item.produtos.preco_custo) * item.quantidade;
            totalCommission += profit;
          }
        });
      });
      
      return totalCommission;
    }
  });

  // Calculate annual commissions for 2025
  const { data: annualCommissions } = useQuery({
    queryKey: ['annual-commissions-2025'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          id,
          data_criacao,
          itens_encomenda (
            quantidade,
            preco_unitario,
            produtos (
              preco_custo
            )
          )
        `)
        .gte('data_criacao', '2025-01-01')
        .lt('data_criacao', '2026-01-01');

      if (error) return 0;
      
      let totalCommission = 0;
      data?.forEach(encomenda => {
        encomenda.itens_encomenda?.forEach(item => {
          if (item.produtos && item.preco_unitario && item.produtos.preco_custo) {
            const profit = (item.preco_unitario - item.produtos.preco_custo) * item.quantidade;
            totalCommission += profit;
          }
        });
      });
      
      return totalCommission;
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", variant: "secondary" as const },
      sent: { label: "Enviado", variant: "default" as const },
      delivered: { label: "Entregue", variant: "outline" as const }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio de cosméticos capilares</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Encomendas Ativas"
          value={12}
          subtitle="4 pendentes"
          icon={<Package className="h-6 w-6" />}
          trend={{ value: 8.2, isPositive: true }}
        />
        
        <StatCard
          title="A Receber"
          value="€18.650"
          subtitle="3 clientes"
          icon={<DollarSign className="h-6 w-6" />}
          variant="success"
          trend={{ value: 12.5, isPositive: true }}
        />
        
        <StatCard
          title="A Pagar"
          value="€5.240"
          subtitle="2 fornecedores"
          icon={<AlertCircle className="h-6 w-6" />}
          variant="warning"
        />
        
        <StatCard
          title="Comissões Mensais"
          value={`€${(monthlyCommissions || 0).toFixed(2)}`}
          subtitle={`${new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="Comissões Anuais 2025"
          value={`€${(annualCommissions || 0).toFixed(2)}`}
          subtitle="Total do ano"
          icon={<Calendar className="h-6 w-6" />}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Encomendas Recentes</CardTitle>
            <CardDescription>Últimas movimentações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const status = getStatusBadge(order.status);
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.client}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-semibold text-sm">€{order.value.toFixed(2)}</p>
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

        {/* Pending Payments */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pagamentos Pendentes</CardTitle>
            <CardDescription>Valores a receber dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{payment.client}</p>
                    <p className="text-xs text-muted-foreground">Venc: {payment.dueDate}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-semibold text-sm">€{payment.amount.toFixed(2)}</p>
                    {payment.overdue && (
                      <div className="flex items-center text-destructive text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Vencido
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}