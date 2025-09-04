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

  // Função utilitária para gerar datas ISO
  function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;
  }

  // Comissões Mensais - baseado na data de produção
  const { data: comissoesMensais = 0 } = useQuery({
    queryKey: ['comissoes-mensais'],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Get order items from orders with production date in current month
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`
          quantidade,
          preco_unitario,
          preco_custo,
          encomendas!inner(data_producao_estimada)
        `)
        .gte('encomendas.data_producao_estimada', isoDate(start))
        .lt('encomendas.data_producao_estimada', isoDate(end));
      
      if (error || !itens) return 0;
      
      // Calculate total profit (commission) from current month items
      const total = itens.reduce((acc, item) => {
        const quantidade = item.quantidade || 0;
        const precoUnitario = item.preco_unitario || 0;
        const precoCusto = item.preco_custo || 0;
        const lucro = quantidade * precoUnitario - quantidade * precoCusto;
        return acc + lucro;
      }, 0);
      
      return total;
    }
  });

  // Comissões Anuais - soma de todas as encomendas
  const { data: comissoesAnuais = 0 } = useQuery({
    queryKey: ['comissoes-anuais'],
    queryFn: async () => {
      // Get all order items with their prices
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`
          quantidade,
          preco_unitario,
          preco_custo
        `);
      
      if (error || !itens) return 0;
      
      // Calculate total profit (commission) from all items
      const total = itens.reduce((acc, item) => {
        const quantidade = item.quantidade || 0;
        const precoUnitario = item.preco_unitario || 0;
        const precoCusto = item.preco_custo || 0;
        const lucro = quantidade * precoUnitario - quantidade * precoCusto;
        return acc + lucro;
      }, 0);
      
      return total;
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
          subtitle="Lucro do mês atual por data de produção"
          icon={<div />}
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard
          title="Comissões (Ano)"
          value={formatCurrency(comissoesAnuais)}
          subtitle="Lucro total de todas as encomendas"
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