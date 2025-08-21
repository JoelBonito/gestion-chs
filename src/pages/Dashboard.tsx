
import { Package, DollarSign, TrendingUp, Users, AlertCircle, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  // Fetch encomendas ativas (não entregues)
  const { data: encomendasAtivas } = useQuery({
    queryKey: ['encomendas-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('*')
        .neq('status', 'ENTREGUE');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch dados para A RECEBER (saldo devedor de todas as encomendas)
  const { data: totalAReceber } = useQuery({
    queryKey: ['total-a-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('saldo_devedor');

      if (error) throw error;
      
      const total = data?.reduce((sum, encomenda) => {
        return sum + (parseFloat(encomenda.saldo_devedor) || 0);
      }, 0) || 0;

      return total;
    }
  });

  // Fetch dados para A PAGAR (saldo devedor fornecedor de todas as encomendas)
  const { data: totalAPagar } = useQuery({
    queryKey: ['total-a-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('saldo_devedor_fornecedor');

      if (error) throw error;
      
      const total = data?.reduce((sum, encomenda) => {
        return sum + (parseFloat(encomenda.saldo_devedor_fornecedor) || 0);
      }, 0) || 0;

      return total;
    }
  });

  // Calculate monthly commissions (diferença entre a receber e a pagar do mês atual)
  const { data: monthlyCommissions } = useQuery({
    queryKey: ['monthly-commissions'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const { data, error } = await supabase
        .from('encomendas')
        .select('valor_total, valor_total_custo')
        .gte('data_criacao', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('data_criacao', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (error) return 0;
      
      const totalCommission = data?.reduce((sum, encomenda) => {
        const valorTotal = parseFloat(encomenda.valor_total) || 0;
        const valorCusto = parseFloat(encomenda.valor_total_custo) || 0;
        return sum + (valorTotal - valorCusto);
      }, 0) || 0;
      
      return totalCommission;
    }
  });

  // Calculate annual commissions for current year
  const { data: annualCommissions } = useQuery({
    queryKey: ['annual-commissions'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('encomendas')
        .select('valor_total, valor_total_custo')
        .gte('data_criacao', `${currentYear}-01-01`)
        .lt('data_criacao', `${currentYear + 1}-01-01`);

      if (error) return 0;
      
      const totalCommission = data?.reduce((sum, encomenda) => {
        const valorTotal = parseFloat(encomenda.valor_total) || 0;
        const valorCusto = parseFloat(encomenda.valor_total_custo) || 0;
        return sum + (valorTotal - valorCusto);
      }, 0) || 0;
      
      return totalCommission;
    }
  });

  // Fetch recent orders data
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          id,
          numero_encomenda,
          status,
          valor_total,
          data_criacao,
          clientes(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch pending payments
  const { data: pendingPayments } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          id,
          numero_encomenda,
          saldo_devedor,
          data_criacao,
          clientes(nome)
        `)
        .gt('saldo_devedor', 0)
        .order('data_criacao', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch payments to make
  const { data: paymentsToMake } = useQuery({
    queryKey: ['payments-to-make'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          id,
          numero_encomenda,
          saldo_devedor_fornecedor,
          data_criacao,
          fornecedores(nome)
        `)
        .gt('saldo_devedor_fornecedor', 0)
        .order('data_criacao', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      "NOVO PEDIDO": { label: "Novo Pedido", variant: "secondary" as const },
      "PRODUÇÃO": { label: "Produção", variant: "default" as const },
      "EMBALAGEM": { label: "Embalagem", variant: "default" as const },
      "TRANSPORTE": { label: "Transporte", variant: "default" as const },
      "ENTREGUE": { label: "Entregue", variant: "outline" as const }
    };
    return variants[status as keyof typeof variants] || variants["NOVO PEDIDO"];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  // Count encomendas pendentes
  const encomendasPendentes = encomendasAtivas?.filter(e => 
    e.status === 'NOVO PEDIDO' || e.status === 'PRODUÇÃO'
  ).length || 0;

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
          value={encomendasAtivas?.length || 0}
          subtitle={`${encomendasPendentes} pendentes`}
          icon={<Package className="h-6 w-6" />}
          trend={{ value: 8.2, isPositive: true }}
        />
        
        <StatCard
          title="A Receber"
          value={formatCurrency(totalAReceber || 0)}
          subtitle="Saldo devedor clientes"
          icon={<DollarSign className="h-6 w-6" />}
          variant="success"
          trend={{ value: 12.5, isPositive: true }}
        />
        
        <StatCard
          title="A Pagar"
          value={formatCurrency(totalAPagar || 0)}
          subtitle="Saldo devedor fornecedores"
          icon={<AlertCircle className="h-6 w-6" />}
          variant="warning"
        />
        
        <StatCard
          title="Comissões Mensais"
          value={formatCurrency(monthlyCommissions || 0)}
          subtitle={`${new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="Comissões Anuais"
          value={formatCurrency(annualCommissions || 0)}
          subtitle={`Ano ${new Date().getFullYear()}`}
          icon={<Calendar className="h-6 w-6" />}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders in Progress */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Encomendas em Curso</CardTitle>
            <CardDescription>Encomendas em andamento no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const status = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{order.numero_encomenda}</p>
                        <p className="text-xs text-muted-foreground">{order.clientes?.nome}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.data_criacao)}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-semibold text-sm">{formatCurrency(parseFloat(order.valor_total))}</p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma encomenda recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments to Receive */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pagamentos por Receber</CardTitle>
            <CardDescription>Valores a receber dos clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments && pendingPayments.length > 0 ? (
                pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{payment.clientes?.nome}</p>
                      <p className="text-xs text-muted-foreground">Pedido: {payment.numero_encomenda}</p>
                      <p className="text-xs text-muted-foreground">Data: {formatDate(payment.data_criacao)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(parseFloat(payment.saldo_devedor))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento pendente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments to Make */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pagamentos a Realizar</CardTitle>
            <CardDescription>Valores a pagar aos fornecedores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentsToMake && paymentsToMake.length > 0 ? (
                paymentsToMake.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{payment.fornecedores?.nome}</p>
                      <p className="text-xs text-muted-foreground">Pedido: {payment.numero_encomenda}</p>
                      <p className="text-xs text-muted-foreground">Data: {formatDate(payment.data_criacao)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(parseFloat(payment.saldo_devedor_fornecedor))}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento a fazer
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
