import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { RoleBasedGuard } from "@/components/RoleBasedGuard";
import { useAuth } from "@/hooks/useAuth";
import { Home, ClipboardList, DollarSign, Truck, Package, Factory, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTopBarActions } from "@/context/TopBarActionsContext";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { setActions } = useTopBarActions();

  // Teleport System Status to TopBar
  useEffect(() => {
    setActions(
      <div className="bg-surface border-border flex items-center gap-2 rounded-full border px-3 py-1.5">
        <div className="bg-success h-2 w-2 animate-pulse rounded-full" />
        <span className="text-foreground text-xs font-medium">Sistema Operacional</span>
      </div>
    );
    return () => setActions(null);
  }, [setActions]);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  // --- QUERY LOGIC (UNCHANGED) ---
  const { data: encomendasAtivas = 0 } = useQuery({
    queryKey: ["encomendas-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select("*")
        .neq("status", "ENTREGUE");
      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: aReceber = 0 } = useQuery({
    queryKey: ["a-receber"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select("saldo_devedor")
        .gt("saldo_devedor", 0);
      if (error) throw error;
      const total =
        data?.reduce((sum, encomenda) => {
          return sum + (parseFloat(String(encomenda.saldo_devedor || 0)) || 0);
        }, 0) || 0;
      return total;
    },
  });

  const { data: aPagar = 0 } = useQuery({
    queryKey: ["a-pagar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select("saldo_devedor_fornecedor")
        .gt("saldo_devedor_fornecedor", 0);
      if (error) throw error;
      const total =
        data?.reduce((sum, encomenda) => {
          return sum + (parseFloat(String(encomenda.saldo_devedor_fornecedor || 0)) || 0);
        }, 0) || 0;
      return total;
    },
  });

  function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00`;
  }

  const { data: comissoesMensais = 0 } = useQuery({
    queryKey: ["comissoes-mensais"],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(
          `
          quantidade,
          preco_unitario,
          preco_custo,
          encomendas!inner(data_producao_estimada)
        `
        )
        .gte("encomendas.data_producao_estimada", isoDate(start))
        .lt("encomendas.data_producao_estimada", isoDate(end));
      if (error || !itens) return 0;

      const total = itens.reduce((acc, item) => {
        const quantidade = item.quantidade || 0;
        const precoUnitario = item.preco_unitario || 0;
        const precoCusto = item.preco_custo || 0;
        const lucro = quantidade * precoUnitario - quantidade * precoCusto;
        return acc + lucro;
      }, 0);
      return total;
    },
  });

  const { data: comissoesAnuais = 0 } = useQuery({
    queryKey: ["comissoes-anuais"],
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
    },
  });

  const { data: comissoesPorMes = [] } = useQuery({
    queryKey: ["comissoes-2025"],
    queryFn: async () => {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(
          `
          quantidade,
          preco_unitario,
          preco_custo,
          encomendas!inner(data_producao_estimada)
        `
        )
        .gte("encomendas.data_producao_estimada", "2025-01-01")
        .lt("encomendas.data_producao_estimada", "2026-01-01");
      if (error || !itens) return [];
      const meses = Array(12).fill(0);
      itens.forEach((item) => {
        const dataProd = item.encomendas?.data_producao_estimada;
        if (!dataProd) return;
        const mes = new Date(dataProd).getMonth();
        const lucro =
          (item.quantidade || 0) * ((item.preco_unitario || 0) - (item.preco_custo || 0));
        meses[mes] += lucro;
      });
      return meses;
    },
  });

  const { data: encomendasProgresso = [] } = useQuery({
    queryKey: ["encomendas-progresso"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          *,
          clientes (nome)
        `
        )
        .neq("status", "ENTREGUE")
        .order("data_criacao", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pagamentosReceber = [] } = useQuery({
    queryKey: ["pagamentos-receber"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          *,
          clientes (nome)
        `
        )
        .gt("saldo_devedor", 0)
        .order("data_criacao", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pagamentosFazer = [] } = useQuery({
    queryKey: ["pagamentos-fazer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          *,
          fornecedores (nome)
        `
        )
        .gt("saldo_devedor_fornecedor", 0)
        .order("data_criacao", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusInfo = (status: string) => {
    const isHamAdmin = user?.email === "ham@admin.com";
    const getStatusLabel = (status: string): string => {
      if (!isHamAdmin) return status;
      switch (status) {
        case "NOVO PEDIDO":
          return "Nouvelle demande";
        case "MATÉRIA PRIMA":
          return "Matières premières";
        case "PRODUÇÃO":
          return "Production";
        case "EMBALAGENS":
          return "Emballage";
        case "TRANSPORTE":
          return "Transport";
        case "ENTREGUE":
          return "Livré";
        default:
          return status;
      }
    };

    // Status color mapping for Badge
    const getStatusStyle = (status: string) => {
      switch (status) {
        case "NOVO PEDIDO":
          return { variant: "default" as const, className: "bg-blue-600 hover:bg-blue-700" };
        case "PRODUÇÃO":
          return { variant: "default" as const, className: "bg-sky-500 hover:bg-sky-600" };
        case "MATÉRIA PRIMA":
          return { variant: "default" as const, className: "bg-orange-500 hover:bg-orange-600" };
        case "EMBALAGENS":
          return { variant: "default" as const, className: "bg-emerald-500 hover:bg-emerald-600" };
        case "TRANSPORTE":
          return {
            variant: "outline" as const,
            className: "border-purple-500 text-purple-600 dark:text-purple-400",
          };
        case "ENTREGUE":
          return {
            variant: "secondary" as const,
            className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
          };
        default:
          return { variant: "secondary" as const, className: "" };
      }
    };

    const style = getStatusStyle(status);

    return {
      label: getStatusLabel(status) || "N/A",
      variant: style.variant,
      className: style.className,
    };
  };

  return (
    <RoleBasedGuard>
      <div className="bg-background dark:bg-background min-h-screen w-full">
        <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
          {/* Main Stats Grid with Stagger Animation */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
          >
            <motion.div variants={item} className="h-full">
              <StatCard
                title="Encomendas Ativas"
                value={encomendasAtivas.toString()}
                subtitle="Em andamento"
                icon={<ClipboardList className="h-5 w-5" />}
                variant="info"
              />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <StatCard
                title="A Receber"
                value={formatCurrencyEUR(aReceber)}
                subtitle="Dos clientes"
                icon={<DollarSign className="h-5 w-5" />}
                variant="success"
              />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <StatCard
                title="A Pagar"
                value={formatCurrencyEUR(aPagar)}
                subtitle="Aos fornecedores"
                icon={<Truck className="h-5 w-5" />}
                variant="warning"
              />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <StatCard
                title="Comissões (Mês)"
                value={formatCurrencyEUR(comissoesMensais)}
                subtitle="Lucro Atual"
                icon={<TrendingUp className="h-5 w-5" />}
                variant="default"
              />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <StatCard
                title="Comissões (Ano)"
                value={formatCurrencyEUR(comissoesAnuais)}
                subtitle="Acumulado 2025"
                icon={<Factory className="h-5 w-5" />}
                variant="default"
              />
            </motion.div>
          </motion.div>

          {/* Monthly Commissions Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="text-muted-foreground h-5 w-5" />
              <h3 className="text-foreground/80 text-lg font-semibold">Performance Mensal 2025</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((mes, i) => (
                <motion.div
                  key={mes}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <StatCard
                    title={`${mes}`}
                    value={formatCurrencyEUR(comissoesPorMes[i] || 0)}
                    subtitle={i < new Date().getMonth() ? "Finalizado" : "Projetado"}
                    className={comissoesPorMes[i] > 0 ? "" : "opacity-70"}
                  />
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {["Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((mes, i) => {
                const monthIndex = i + 6; // Jul=6, Ago=7, ..., Dez=11
                const currentMonth = new Date().getMonth();
                const isFinalizado = monthIndex <= currentMonth;

                return (
                  <motion.div
                    key={mes}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <StatCard
                      title={`${mes}`}
                      value={formatCurrencyEUR(comissoesPorMes[monthIndex] || 0)}
                      subtitle={isFinalizado ? "Finalizado" : "Futuro"}
                      className={
                        isFinalizado
                          ? comissoesPorMes[monthIndex] > 0
                            ? ""
                            : "opacity-70"
                          : "opacity-60"
                      }
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Detailed Activity Section - Glassmorphism Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-8 lg:grid-cols-3"
          >
            {/* Encomendas em Progresso */}
            <motion.div variants={item} className="h-full">
              <Card className="bg-card h-full border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="text-primary h-5 w-5" />
                    Em Produção
                  </CardTitle>
                  <CardDescription>Últimas encomendas ativas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {encomendasProgresso.length === 0 ? (
                    <div className="text-muted-foreground bg-muted/30 rounded-lg border border-dashed py-8 text-center">
                      Sem atividades recentes
                    </div>
                  ) : (
                    encomendasProgresso.map((order) => {
                      const status = getStatusInfo(order.status);
                      return (
                        <motion.div
                          key={order.id}
                          whileHover={{ x: 4 }}
                          className="bg-popover border-border/50 hover:border-primary/40 flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all duration-300"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                #{order.numero_encomenda}
                              </span>
                            </div>
                            <p className="text-muted-foreground max-w-[120px] truncate text-xs">
                              {order.clientes?.nome || "Cliente desconhecido"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 text-right">
                            <Badge
                              variant={status.variant}
                              className={cn(
                                "h-5 px-2 py-0.5 text-[10px] whitespace-nowrap",
                                status.className
                              )}
                            >
                              {status.label}
                            </Badge>
                            <span className="text-muted-foreground block text-xs font-medium">
                              {formatDate(order.data_criacao)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pagamentos a Receber */}
            <motion.div variants={item} className="h-full">
              <Card className="bg-card h-full border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-success flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Recebíveis
                  </CardTitle>
                  <CardDescription>Valores pendentes de entrada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pagamentosReceber.length === 0 ? (
                    <div className="text-muted-foreground bg-muted/30 rounded-lg border border-dashed py-8 text-center">
                      Tudo em dia!
                    </div>
                  ) : (
                    pagamentosReceber.map((payment) => (
                      <motion.div
                        key={payment.id}
                        whileHover={{ x: 4 }}
                        className="bg-popover border-success/20 dark:border-success/10 hover:border-success/40 flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all"
                      >
                        <div className="space-y-1">
                          <span className="text-success text-sm font-bold">
                            {formatCurrencyEUR(parseFloat(String(payment.saldo_devedor || 0)))}
                          </span>
                          <p className="text-muted-foreground max-w-[140px] truncate text-xs">
                            {payment.clientes?.nome}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground bg-success/10 rounded-md px-2 py-1 text-xs">
                            #{payment.numero_encomenda}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pagamentos a Fazer */}
            <motion.div variants={item} className="h-full">
              <Card className="bg-card h-full border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="text-warning flex items-center gap-2">
                    <Truck className="h-5 w-5" />A Pagar
                  </CardTitle>
                  <CardDescription>Compromissos com fornecedores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pagamentosFazer.length === 0 ? (
                    <div className="text-muted-foreground bg-muted/30 rounded-lg border border-dashed py-8 text-center">
                      Nenhum pagamento pendente
                    </div>
                  ) : (
                    pagamentosFazer.map((payment) => (
                      <motion.div
                        key={payment.id}
                        whileHover={{ x: 4 }}
                        className="bg-popover border-warning/20 dark:border-warning/10 hover:border-warning/40 flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all"
                      >
                        <div className="space-y-1">
                          <span className="text-warning text-sm font-bold">
                            {formatCurrencyEUR(
                              parseFloat(String(payment.saldo_devedor_fornecedor || 0))
                            )}
                          </span>
                          <p className="text-muted-foreground max-w-[140px] truncate text-xs">
                            {payment.fornecedores?.nome}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground bg-warning/10 rounded-md px-2 py-1 text-xs">
                            #{payment.numero_encomenda}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </RoleBasedGuard>
  );
}
