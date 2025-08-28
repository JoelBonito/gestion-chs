
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Dashboard() {
  // Encomendas Ativas (não entregues)
  const { data: encomendasAtivas = 0 } = useQuery({
    queryKey: ['encomendas-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('*')
        .neq('status', 'ENTREGUE');
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // A Receber - soma dos saldos devedores das encomendas
  const { data: aReceber = 0 } = useQuery({
    queryKey: ['a-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('saldo_devedor')
        .gt('saldo_devedor', 0);
      
      if (error) throw error;
      
      const total = data?.reduce((sum, encomenda) => {
        return sum + (parseFloat(String(encomenda.saldo_devedor || 0)) || 0);
      }, 0) || 0;

      return total;
    }
  });

  // A Pagar - soma dos saldos devedores dos fornecedores
  const { data: aPagar = 0 } = useQuery({
    queryKey: ['a-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select('saldo_devedor_fornecedor')
        .gt('saldo_devedor_fornecedor', 0);
      
      if (error) throw error;
      
      const total = data?.reduce((sum, encomenda) => {
        return sum + (parseFloat(String(encomenda.saldo_devedor_fornecedor || 0)) || 0);
      }, 0) || 0;

      return total;
    }
  });

  // Comissões Mensais
  const { data: comissoesMensais = 0 } = useQuery({
    queryKey: ['comissoes-mensais'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('encomendas')
        .select('valor_total, valor_total_custo, data_producao_estimada')
        .gte('data_producao_estimada', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('data_producao_estimada', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
      
      if (error) return 0;
      
      const totalCommission = data?.reduce((sum, encomenda) => {
        const valorTotal = parseFloat(String(encomenda.valor_total || 0)) || 0;
        const valorCusto = parseFloat(String(encomenda.valor_total_custo || 0)) || 0;
        return sum + (valorTotal - valorCusto);
      }, 0) || 0;
      
      return totalCommission;
    }
  });

  // Comissões Anuais
  const { data: comissoesAnuais = 0 } = useQuery({
    queryKey: ['comissoes-anuais'],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('encomendas')
        .select('valor_total, valor_total_custo, data_criacao')
        .gte('data_criacao', `${currentYear}-01-01`)
        .lt('data_criacao', `${currentYear + 1}-01-01`);
      
      if (error) return 0;
      
      const totalCommission = data?.reduce((sum, encomenda) => {
        const valorTotal = parseFloat(String(encomenda.valor_total || 0)) || 0;
        const valorCusto = parseFloat(String(encomenda.valor_total_custo || 0)) || 0;
        return sum + (valorTotal - valorCusto);
      }, 0) || 0;
      
      return totalCommission;
    }
  });

  // Encomendas em Progresso
  const { data: encomendasProgresso = [] } = useQuery({
    queryKey: ['encomendas-progresso'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          *,
          clientes (nome)
        `)
        .neq('status', 'ENTREGUE')
        .order('data_criacao', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Pagamentos a Receber
  const { data: pagamentosReceber = [] } = useQuery({
    queryKey: ['pagamentos-receber'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          *,
          clientes (nome)
        `)
        .gt('saldo_devedor', 0)
        .order('data_criacao', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Pagamentos a Fazer
  const { data: pagamentosFazer = [] } = useQuery({
    queryKey: ['pagamentos-fazer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('encomendas')
        .select(`
          *,
          fornecedores (nome)
        `)
        .gt('saldo_devedor_fornecedor', 0)
        .order('data_criacao', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'NOVO PEDIDO':
        return { label: 'Novo Pedido', variant: 'secondary' as const };
      case 'PRODUÇÃO':
        return { label: 'Produção', variant: 'default' as const };
      case 'EMBALAGEM':
        return { label: 'Embalagem', variant: 'outline' as const };
      case 'TRANSPORTE':
        return { label: 'Transporte', variant: 'default' as const };
      case 'ENTREGUE':
        return { label: 'Entregue', variant: 'default' as const };
      default:
        return { label: status || 'N/A', variant: 'secondary' as const };
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Encomendas Ativas"
          value={encomendasAtivas.toString()}
          subtitle="Encomendas não entregues"
          icon={<div />}
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(aReceber)}
          subtitle="Valor pendente de clientes"
          icon={<div />}
        />
        <StatCard
          title="A Pagar"
          value={formatCurrency(aPagar)}
          subtitle="Valor pendente a fornecedores"
          icon={<div />}
        />
        <StatCard
          title="Comissões (Mês)"
          value={formatCurrency(comissoesMensais)}
          subtitle="Lucro do mês atual"
          icon={<div />}
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard
          title="Comissões (Ano)"
          value={formatCurrency(comissoesAnuais)}
          subtitle="Lucro do ano atual"
          icon={<div />}
        />
      </div>

      {/* Tabelas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Encomendas em Progresso */}
        <Card>
          <CardHeader>
            <CardTitle>Encomendas em Progresso</CardTitle>
            <CardDescription>
              Últimas 5 encomendas não entregues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {encomendasProgresso.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma encomenda em progresso
                </p>
              ) : (
                encomendasProgresso.map((order) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">#{order.numero_encomenda}</p>
                        <p className="text-xs text-muted-foreground">{order.clientes?.nome || 'Cliente não encontrado'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.data_criacao)}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-semibold text-sm">{formatCurrency(parseFloat(String(order.valor_total || 0)))}</p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos a Receber */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos a Receber</CardTitle>
            <CardDescription>
              Clientes com saldo devedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pagamentosReceber.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento pendente
                </p>
              ) : (
                pagamentosReceber.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">#{payment.numero_encomenda}</p>
                      <p className="text-xs text-muted-foreground">{payment.clientes?.nome || 'Cliente não encontrado'}</p>
                      <p className="text-xs text-muted-foreground">Data: {formatDate(payment.data_criacao)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(parseFloat(String(payment.saldo_devedor || 0)))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos a Fazer */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos a Fazer</CardTitle>
            <CardDescription>
              Fornecedores com saldo a receber
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pagamentosFazer.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento pendente
                </p>
              ) : (
                pagamentosFazer.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">#{payment.numero_encomenda}</p>
                      <p className="text-xs text-muted-foreground">{payment.fornecedores?.nome || 'Fornecedor não encontrado'}</p>
                      <p className="text-xs text-muted-foreground">Data: {formatDate(payment.data_criacao)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(parseFloat(String(payment.saldo_devedor_fornecedor || 0)))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
