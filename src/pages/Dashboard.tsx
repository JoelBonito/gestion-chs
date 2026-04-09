import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatCard } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatCurrencyEUR, formatCurrencyBRL, eurToBrl } from "@/lib/utils/currency";
import { RoleBasedGuard } from "@/components/RoleBasedGuard";
import { useAuth } from "@/hooks/useAuth";
import { Home, ClipboardList, DollarSign, Truck, Package, Factory, TrendingUp, Edit2, Save, RefreshCw } from "lucide-react";
import { calcularComissaoItem } from "@/lib/utils/commission";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTopBarActions } from "@/context/TopBarActionsContext";
import { cn } from "@/lib/utils";
import { getExchangeRate, updateExchangeRate, fetchExchangeRate } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { user } = useAuth();
  const { setActions } = useTopBarActions();

  // Estados para seleção de ano
  const [performanceYear, setPerformanceYear] = useState(2026);
  const [comissaoModalData, setComissaoModalData] = useState<{ title: string; encomendas: ComissaoEncomenda[]; total: number } | null>(null);
  const [comissoesAnoYear, setComissoesAnoYear] = useState(2026);

  // Exchange rate state
  const isAdmin = user?.email === "jbento1@gmail.com" || user?.email === "admin@admin.com";
  const [exchangeRate, setExchangeRate] = useState(getExchangeRate());
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  // Load exchange rate on mount
  useEffect(() => {
    fetchExchangeRate().then((rate) => setExchangeRate(rate));
  }, []);

  const handleSaveRate = async () => {
    const parsed = parseFloat(rateInput.replace(",", "."));
    if (!(parsed > 0) || !Number.isFinite(parsed)) {
      toast.error("Taxa inválida. Use um número positivo.");
      return;
    }
    setSavingRate(true);
    const ok = await updateExchangeRate(parsed);
    setSavingRate(false);
    if (ok) {
      setExchangeRate(parsed);
      setEditingRate(false);
      toast.success(`Taxa atualizada: 1 EUR = ${parsed.toFixed(2)} BRL`);
    } else {
      toast.error("Erro ao salvar taxa de câmbio.");
    }
  };

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

  // --- QUERY LOGIC (OPTIMIZED) ---
  const { data: encomendasAtivas = 0 } = useQuery({
    queryKey: ["encomendas-ativas"],
    queryFn: async () => {
      // Only select id for count - reduces payload
      const { data, error } = await supabase
        .from("encomendas")
        .select("id", { count: "exact", head: true })
        .neq("status", "ENTREGUE");
      if (error) throw error;
      return data?.length || 0;
    },
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
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

  // Types for commission queries
  interface CommissionItemRow {
    id: string;
    quantidade: number;
    preco_unitario: number;
    preco_custo: number;
    produtos: { lucro_joel: number | null; fornecedor_id: string | null } | null;
    encomendas: {
      numero_encomenda: string;
      etiqueta: string | null;
      status: string;
      fornecedor_id: string | null;
      data_producao_estimada: string | null;
      valor_frete: number | null;
      custo_frete: number | null;
    } | null;
  }

  interface ComissaoEncomenda {
    numero_encomenda: string;
    etiqueta: string | null;
    comissao: number;
  }

  interface MesComissaoData {
    total: number;
    encomendas: ComissaoEncomenda[];
  }

  interface CustoRow {
    item_encomenda_id: string;
    lucro_joel_real: number;
  }

  function buildCustoMap(custosData: CustoRow[] | null): Record<string, number> {
    const map: Record<string, number> = {};
    (custosData || []).forEach((c) => { map[c.item_encomenda_id] = c.lucro_joel_real; });
    return map;
  }

  function computeCommissionTotal(itens: CommissionItemRow[], custosByItemId: Record<string, number>): number {
    return itens.reduce((acc, item) => {
      const enc = item.encomendas;
      return acc + calcularComissaoItem(
        {
          quantidade: item.quantidade || 0,
          preco_unitario: item.preco_unitario || 0,
          preco_custo: item.preco_custo || 0,
          lucro_joel: item.produtos?.lucro_joel ?? null,
          lucro_joel_real: custosByItemId[item.id] ?? null,
          fornecedor_id: item.produtos?.fornecedor_id ?? undefined,
        },
        {
          numero_encomenda: enc?.numero_encomenda || "",
          status: enc?.status || "",
          fornecedor_id: enc?.fornecedor_id ?? undefined,
        }
      );
    }, 0);
  }

  async function fetchCustos(itemIds: string[]): Promise<Record<string, number>> {
    if (itemIds.length === 0) return {};
    const { data } = await supabase
      .from("custos_producao_encomenda")
      .select("item_encomenda_id, lucro_joel_real")
      .in("item_encomenda_id", itemIds);
    return buildCustoMap(data);
  }

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
          id,
          quantidade,
          preco_unitario,
          preco_custo,
          produtos(lucro_joel, fornecedor_id),
          encomendas!inner(numero_encomenda, status, fornecedor_id, data_producao_estimada)
        `
        )
        .gte("encomendas.data_producao_estimada", isoDate(start))
        .lt("encomendas.data_producao_estimada", isoDate(end));
      if (error || !itens) return 0;

      const typedItens = itens as unknown as CommissionItemRow[];
      const custosByItemId = await fetchCustos(typedItens.map((it) => it.id));
      return computeCommissionTotal(typedItens, custosByItemId);
    },
  });

  const { data: comissoesAnuais = 0 } = useQuery({
    queryKey: ["comissoes-anuais", comissoesAnoYear],
    queryFn: async () => {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`
          id,
          quantidade,
          preco_unitario,
          preco_custo,
          produtos(lucro_joel, fornecedor_id),
          encomendas!inner(numero_encomenda, status, fornecedor_id, data_producao_estimada)
        `)
        .gte("encomendas.data_producao_estimada", `${comissoesAnoYear}-01-01`)
        .lt("encomendas.data_producao_estimada", `${comissoesAnoYear + 1}-01-01`);
      if (error || !itens) return 0;

      const typedItens = itens as unknown as CommissionItemRow[];
      const custosByItemId = await fetchCustos(typedItens.map((it) => it.id));
      return computeCommissionTotal(typedItens, custosByItemId);
    },
  });

  const { data: comissoesPorMes = [] } = useQuery<MesComissaoData[]>({
    queryKey: ["comissoes-por-mes", performanceYear],
    queryFn: async () => {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(
          `
          id,
          quantidade,
          preco_unitario,
          preco_custo,
          produtos(lucro_joel, fornecedor_id),
          encomendas!inner(numero_encomenda, etiqueta, status, fornecedor_id, data_producao_estimada, valor_frete, custo_frete)
        `
        )
        .gte("encomendas.data_producao_estimada", `${performanceYear}-01-01`)
        .lt("encomendas.data_producao_estimada", `${performanceYear + 1}-01-01`);
      if (error || !itens) return Array.from({ length: 12 }, () => ({ total: 0, encomendas: [] }));

      const typedItens = itens as unknown as CommissionItemRow[];
      const custosByItemId = await fetchCustos(typedItens.map((it) => it.id));

      // Group by month and by order
      const meses: MesComissaoData[] = Array.from({ length: 12 }, () => ({ total: 0, encomendas: [] }));
      // Track per-order commission per month: meses[month][numero_encomenda] = { ... }
      const mesOrderMap: Record<number, Record<string, ComissaoEncomenda>> = {};

      typedItens.forEach((item) => {
        const enc = item.encomendas;
        const dataProd = enc?.data_producao_estimada;
        if (!dataProd) return;
        const mes = new Date(dataProd).getMonth();
        const comissao = calcularComissaoItem(
          {
            quantidade: item.quantidade || 0,
            preco_unitario: item.preco_unitario || 0,
            preco_custo: item.preco_custo || 0,
            lucro_joel: item.produtos?.lucro_joel ?? null,
            lucro_joel_real: custosByItemId[item.id] ?? null,
            fornecedor_id: item.produtos?.fornecedor_id ?? undefined,
          },
          {
            numero_encomenda: enc?.numero_encomenda || "",
            status: enc?.status || "",
            fornecedor_id: enc?.fornecedor_id ?? undefined,
          }
        );
        meses[mes].total += comissao;

        if (!mesOrderMap[mes]) mesOrderMap[mes] = {};
        const numEnc = enc?.numero_encomenda || "";
        if (!mesOrderMap[mes][numEnc]) {
          mesOrderMap[mes][numEnc] = { numero_encomenda: numEnc, etiqueta: enc?.etiqueta || null, comissao: 0 };
        }
        mesOrderMap[mes][numEnc].comissao += comissao;
      });

      // Add frete margin per order (once per unique order per month)
      const freteAdded = new Set<string>();
      typedItens.forEach((item) => {
        const enc = item.encomendas;
        if (!enc?.data_producao_estimada) return;
        const numEnc = enc.numero_encomenda;
        const mes = new Date(enc.data_producao_estimada).getMonth();
        const key = `${mes}_${numEnc}`;
        if (freteAdded.has(key)) return;
        freteAdded.add(key);
        const freteMargin = (enc.valor_frete || 0) - (enc.custo_frete || 0);
        if (freteMargin > 0) {
          meses[mes].total += freteMargin;
          if (mesOrderMap[mes]?.[numEnc]) {
            mesOrderMap[mes][numEnc].comissao += freteMargin;
          }
        }
      });

      // Convert order maps to sorted arrays
      for (let m = 0; m < 12; m++) {
        if (mesOrderMap[m]) {
          meses[m].encomendas = Object.values(mesOrderMap[m])
            .filter(e => e.comissao !== 0)
            .sort((a, b) => b.comissao - a.comissao);
        }
      }
      return meses;
    },
  });

  const { data: encomendasProgresso = [] } = useQuery({
    queryKey: ["encomendas-progresso"],
    queryFn: async () => {
      // Select only fields used in the UI
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          status,
          data_criacao,
          clientes (nome)
        `)
        .neq("status", "ENTREGUE")
        .order("data_criacao", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: pagamentosReceber = [] } = useQuery({
    queryKey: ["pagamentos-receber"],
    queryFn: async () => {
      // Select only fields used in the UI
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          saldo_devedor,
          clientes (nome)
        `)
        .gt("saldo_devedor", 0)
        .order("data_criacao", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: pagamentosFazer = [] } = useQuery({
    queryKey: ["pagamentos-fazer"],
    queryFn: async () => {
      // Select only fields used in the UI
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          saldo_devedor_fornecedor,
          fornecedores (nome)
        `)
        .gt("saldo_devedor_fornecedor", 0)
        .order("data_criacao", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
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
                secondaryValue={formatCurrencyBRL(eurToBrl(aReceber))}
                subtitle="Dos clientes"
                icon={<DollarSign className="h-5 w-5" />}
                variant="success"
              />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <StatCard
                title="A Pagar"
                value={formatCurrencyEUR(aPagar)}
                secondaryValue={formatCurrencyBRL(eurToBrl(aPagar))}
                subtitle="Aos fornecedores"
                icon={<Truck className="h-5 w-5" />}
                variant="warning"
              />
            </motion.div>
            <motion.div variants={item} className="h-full">
              <StatCard
                title="Comissões (Mês)"
                value={formatCurrencyEUR(comissoesMensais)}
                secondaryValue={formatCurrencyBRL(eurToBrl(comissoesMensais))}
                subtitle="Lucro Atual"
                icon={<TrendingUp className="h-5 w-5" />}
                variant="default"
              />
            </motion.div>
            <motion.div variants={item} className="h-full cursor-pointer" onClick={() => {
              const allEncomendas: Record<string, ComissaoEncomenda> = {};
              comissoesPorMes.forEach((m) => {
                (m?.encomendas || []).forEach((e) => {
                  if (!allEncomendas[e.numero_encomenda]) allEncomendas[e.numero_encomenda] = { ...e, comissao: 0 };
                  allEncomendas[e.numero_encomenda].comissao += e.comissao;
                });
              });
              const sorted = Object.values(allEncomendas).filter(e => e.comissao !== 0).sort((a, b) => b.comissao - a.comissao);
              setComissaoModalData({ title: `Comissões ${comissoesAnoYear}`, encomendas: sorted, total: comissoesAnuais });
            }}>
              <StatCard
                title="Comissões (Ano)"
                value={formatCurrencyEUR(comissoesAnuais)}
                secondaryValue={formatCurrencyBRL(eurToBrl(comissoesAnuais))}
                subtitle={`Acumulado ${comissoesAnoYear}`}
                icon={<Factory className="h-5 w-5" />}
                variant="default"
                headerAction={
                  <Select
                    value={String(comissoesAnoYear)}
                    onValueChange={(value) => setComissoesAnoYear(Number(value))}
                  >
                    <SelectTrigger className="h-6 w-[70px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </motion.div>
          </motion.div>

          {/* Exchange Rate Widget - admin only */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="bg-card border-[var(--border)]">
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <RefreshCw className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">Taxa de Câmbio:</span>
                  {editingRate ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">1 EUR =</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveRate(); if (e.key === "Escape") setEditingRate(false); }}
                        className="h-8 w-20 text-sm"
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground">BRL</span>
                      <Button size="sm" variant="gradient" className="h-8" onClick={handleSaveRate} disabled={savingRate}>
                        <Save className="mr-1 h-3 w-3" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingRate(false)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        1 EUR = {exchangeRate.toFixed(2)} BRL
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => { setRateInput(exchangeRate.toFixed(2)); setEditingRate(true); }}
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Monthly Commissions Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="mb-4 flex items-center gap-3">
              <TrendingUp className="text-muted-foreground h-5 w-5" />
              <h3 className="text-foreground/80 text-lg font-semibold">Performance Mensal</h3>
              <Select
                value={String(performanceYear)}
                onValueChange={(value) => setPerformanceYear(Number(value))}
              >
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((mes, i) => {
                const d = comissoesPorMes[i];
                const total = d?.total || 0;
                return (
                  <motion.div
                    key={mes}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    onClick={() => total > 0 && d && setComissaoModalData({ title: `${mes} ${performanceYear}`, encomendas: d.encomendas, total })}
                    className={total > 0 ? "cursor-pointer" : ""}
                  >
                    <StatCard
                      title={`${mes}`}
                      value={formatCurrencyEUR(total)}
                      secondaryValue={total > 0 ? formatCurrencyBRL(eurToBrl(total)) : undefined}
                      subtitle={i < new Date().getMonth() ? "Finalizado" : "Projetado"}
                      className={total > 0 ? "" : "opacity-70"}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {["Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((mes, i) => {
                const monthIndex = i + 6;
                const currentMonth = new Date().getMonth();
                const isFinalizado = monthIndex <= currentMonth;
                const d = comissoesPorMes[monthIndex];
                const total = d?.total || 0;

                return (
                  <motion.div
                    key={mes}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    onClick={() => total > 0 && d && setComissaoModalData({ title: `${mes} ${performanceYear}`, encomendas: d.encomendas, total })}
                    className={total > 0 ? "cursor-pointer" : ""}
                  >
                    <StatCard
                      title={`${mes}`}
                      value={formatCurrencyEUR(total)}
                      secondaryValue={total > 0 ? formatCurrencyBRL(eurToBrl(total)) : undefined}
                      subtitle={isFinalizado ? "Finalizado" : "Futuro"}
                      className={
                        isFinalizado
                          ? total > 0 ? "" : "opacity-70"
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
      {/* Modal de detalhes de comissão */}
      <Dialog open={!!comissaoModalData} onOpenChange={() => setComissaoModalData(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comissões — {comissaoModalData?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-2 text-left font-semibold">Encomenda</th>
                    <th className="pb-2 text-left font-semibold">Etiqueta</th>
                    <th className="pb-2 text-right font-semibold">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {comissaoModalData?.encomendas.map((e) => (
                    <tr key={e.numero_encomenda}>
                      <td className="py-2 font-mono font-semibold text-primary">{e.numero_encomenda}</td>
                      <td className="py-2">
                        {e.etiqueta ? (
                          <Badge variant="secondary" className="text-[10px] uppercase">{e.etiqueta}</Badge>
                        ) : "—"}
                      </td>
                      <td className="py-2 text-right font-semibold">{formatCurrencyEUR(e.comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-bold uppercase text-muted-foreground">Total</span>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">{formatCurrencyEUR(comissaoModalData?.total || 0)}</span>
                <span className="ml-2 text-xs text-muted-foreground">{formatCurrencyBRL(eurToBrl(comissaoModalData?.total || 0))}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RoleBasedGuard>
  );
}
