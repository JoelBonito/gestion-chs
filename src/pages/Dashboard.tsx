import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { RoleBasedGuard } from "@/components/RoleBasedGuard";
import { useAuth } from "@/hooks/useAuth";
import { Home, ClipboardList, DollarSign, Truck, Package, Factory, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  // --- QUERY LOGIC (UNCHANGED) ---
  const { data: encomendasAtivas = 0 } = useQuery({
    queryKey: ['encomendas-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('encomendas').select('*').neq('status', 'ENTREGUE');
      if (error) throw error;
      return data?.length || 0;
    }
  });

  const { data: aReceber = 0 } = useQuery({
    queryKey: ['a-receber'],
    queryFn: async () => {
      const { data, error } = await supabase.from('encomendas').select('saldo_devedor').gt('saldo_devedor', 0);
      if (error) throw error;
      const total = data?.reduce((sum, encomenda) => {
        return sum + (parseFloat(String(encomenda.saldo_devedor || 0)) || 0);
      }, 0) || 0;
      return total;
    }
  });

  const { data: aPagar = 0 } = useQuery({
    queryKey: ['a-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase.from('encomendas').select('saldo_devedor_fornecedor').gt('saldo_devedor_fornecedor', 0);
      if (error) throw error;
      const total = data?.reduce((sum, encomenda) => {
        return sum + (parseFloat(String(encomenda.saldo_devedor_fornecedor || 0)) || 0);
      }, 0) || 0;
      return total;
    }
  });

  function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;
  }

  const { data: comissoesMensais = 0 } = useQuery({
    queryKey: ['comissoes-mensais'],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const { data: itens, error } = await supabase.from("itens_encomenda").select(`
          quantidade,
          preco_unitario,
          preco_custo,
          encomendas!inner(data_producao_estimada)
        `).gte('encomendas.data_producao_estimada', isoDate(start)).lt('encomendas.data_producao_estimada', isoDate(end));
      if (error || !itens) return 0;

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

  const { data: comissoesAnuais = 0 } = useQuery({
    queryKey: ['comissoes-anuais'],
    queryFn: async () => {
      const { data: itens, error } = await supabase.from("itens_encomenda").select(`
          quantidade,
          preco_unitario,
          preco_custo
        `);
      if (error || !itens) return 0;

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

  const { data: comissoesPorMes = [] } = useQuery({
    queryKey: ['comissoes-2025'],
    queryFn: async () => {
      const { data: itens, error } = await supabase.from("itens_encomenda").select(`
          quantidade,
          preco_unitario,
          preco_custo,
          encomendas!inner(data_producao_estimada)
        `).gte('encomendas.data_producao_estimada', '2025-01-01').lt('encomendas.data_producao_estimada', '2026-01-01');
      if (error || !itens) return [];
      const meses = Array(12).fill(0);
      itens.forEach(item => {
        const dataProd = item.encomendas?.data_producao_estimada;
        if (!dataProd) return;
        const mes = new Date(dataProd).getMonth();
        const lucro = (item.quantidade || 0) * ((item.preco_unitario || 0) - (item.preco_custo || 0));
        meses[mes] += lucro;
      });
      return meses;
    }
  });

  const { data: encomendasProgresso = [] } = useQuery({
    queryKey: ['encomendas-progresso'],
    queryFn: async () => {
      const { data, error } = await supabase.from('encomendas').select(`
          *,
          clientes (nome)
        `).neq('status', 'ENTREGUE').order('data_criacao', { ascending: false }).limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pagamentosReceber = [] } = useQuery({
    queryKey: ['pagamentos-receber'],
    queryFn: async () => {
      const { data, error } = await supabase.from('encomendas').select(`
          *,
          clientes (nome)
        `).gt('saldo_devedor', 0).order('data_criacao', { ascending: false }).limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pagamentosFazer = [] } = useQuery({
    queryKey: ['pagamentos-fazer'],
    queryFn: async () => {
      const { data, error } = await supabase.from('encomendas').select(`
          *,
          fornecedores (nome)
        `).gt('saldo_devedor_fornecedor', 0).order('data_criacao', { ascending: false }).limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  const getStatusInfo = (status: string) => {
    const isHamAdmin = user?.email === 'ham@admin.com';
    const getStatusLabel = (status: string): string => {
      if (!isHamAdmin) return status;
      switch (status) {
        case "NOVO PEDIDO": return "Nouvelle demande";
        case "MATÉRIA PRIMA": return "Matières premières";
        case "PRODUÇÃO": return "Production";
        case "EMBALAGENS": return "Emballage";
        case "TRANSPORTE": return "Transport";
        case "ENTREGUE": return "Livré";
        default: return status;
      }
    };

    // Status color mapping for Badge
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'NOVO PEDIDO': 'secondary',
      'PRODUÇÃO': 'default',
      'MATÉRIA PRIMA': 'outline',
      'EMBALAGENS': 'outline',
      'TRANSPORTE': 'default',
      'ENTREGUE': 'default',
    };

    return {
      label: getStatusLabel(status) || 'N/A',
      variant: variants[status] || 'secondary'
    };
  };

  return (
    <RoleBasedGuard>
      <div className="min-h-screen w-full bg-slate-50/50 dark:bg-background">
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 sm:space-y-12">

          {/* Enhanced Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
          >
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Visão geral da sua operação em tempo real
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Sistema Operacional</span>
            </div>
          </motion.div>

          {/* Main Stats Grid with Stagger Animation */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          >
            <motion.div variants={item}>
              <StatCard title="Encomendas Ativas" value={encomendasAtivas.toString()} subtitle="Em andamento" icon={<ClipboardList className="w-5 h-5" />} variant="blue" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard title="A Receber" value={formatCurrencyEUR(aReceber)} subtitle="Dos clientes" icon={<DollarSign className="w-5 h-5" />} variant="emerald" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard title="A Pagar" value={formatCurrencyEUR(aPagar)} subtitle="Aos fornecedores" icon={<Truck className="w-5 h-5" />} variant="orange" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard title="Comissões (Mês)" value={formatCurrencyEUR(comissoesMensais)} subtitle="Lucro Atual" icon={<TrendingUp className="w-5 h-5" />} variant="purple" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard title="Comissões (Ano)" value={formatCurrencyEUR(comissoesAnuais)} subtitle="Acumulado 2025" icon={<Factory className="w-5 h-5" />} variant="pink" />
            </motion.div>
          </motion.div>

          {/* Monthly Commissions Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground/80">Performance Mensal 2025</h3>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((mes, i) => (
                <motion.div key={mes} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <StatCard
                    title={`${mes}`}
                    value={formatCurrencyEUR(comissoesPorMes[i] || 0)}
                    subtitle={i < new Date().getMonth() ? "Finalizado" : "Projetado"}
                    className={comissoesPorMes[i] > 0 ? "border-emerald-500/20 bg-emerald-50/10" : "opacity-70"}
                  />
                </motion.div>
              ))}
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {["Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((mes, i) => (
                <motion.div key={mes} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <StatCard
                    title={`${mes}`}
                    value={formatCurrencyEUR(comissoesPorMes[i + 6] || 0)}
                    subtitle="Futuro"
                    className="opacity-60"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Detailed Activity Section - Glassmorphism Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-8 grid-cols-1 lg:grid-cols-3"
          >
            {/* Encomendas em Progresso */}
            <motion.div variants={item} className="h-full">
              <Card className="h-full border-none shadow-lg bg-white/80 dark:bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Em Produção
                  </CardTitle>
                  <CardDescription>Últimas encomendas ativas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {encomendasProgresso.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      Sem atividades recentes
                    </div>
                  ) : encomendasProgresso.map(order => {
                    const status = getStatusInfo(order.status);
                    return (
                      <motion.div
                        key={order.id}
                        whileHover={{ x: 4 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-background/50 border hover:border-primary/20 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">#{order.numero_encomenda}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {order.clientes?.nome || 'Cliente desconhecido'}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge variant={status.variant} className="text-[10px] px-2 py-0.5 h-5 whitespace-nowrap">
                            {status.label}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground block">
                            {formatDate(order.data_criacao)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pagamentos a Receber */}
            <motion.div variants={item} className="h-full">
              <Card className="h-full border-none shadow-lg bg-emerald-50/50 dark:bg-emerald-950/10 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                    Recebíveis
                  </CardTitle>
                  <CardDescription>Valores pendentes de entrada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pagamentosReceber.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      Tudo em dia!
                    </div>
                  ) : pagamentosReceber.map(payment => (
                    <motion.div
                      key={payment.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-background/40 border border-emerald-100 dark:border-emerald-900/50"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrencyEUR(parseFloat(String(payment.saldo_devedor || 0)))}
                        </span>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {payment.clientes?.nome}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                          #{payment.numero_encomenda}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pagamentos a Fazer */}
            <motion.div variants={item} className="h-full">
              <Card className="h-full border-none shadow-lg bg-orange-50/50 dark:bg-orange-950/10 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Truck className="w-5 h-5" />
                    A Pagar
                  </CardTitle>
                  <CardDescription>Compromissos com fornecedores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pagamentosFazer.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      Nenhum pagamento pendente
                    </div>
                  ) : pagamentosFazer.map(payment => (
                    <motion.div
                      key={payment.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-background/40 border border-orange-100 dark:border-orange-900/50"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                          {formatCurrencyEUR(parseFloat(String(payment.saldo_devedor_fornecedor || 0)))}
                        </span>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {payment.fornecedores?.nome}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">
                          #{payment.numero_encomenda}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </RoleBasedGuard>
  );
}