import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Receipt, DollarSign, Plus, Paperclip, ChevronDown, ChevronRight, Package, Droplets, Tag, Factory, Truck, Hand, Receipt as ReceiptIcon, CircleDollarSign, Ship, List, Layers3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR, formatCurrencyBRL, brlToEur } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { EncomendaView } from "@/components/encomendas";
import { PagamentoFornecedorForm } from "@/components/financeiro";
import { AttachmentManager, FornecedorSelect } from "@/components/shared";
import { IconWithBadge } from "@/components/ui/icon-with-badge";
import { PaymentDetailsModal } from "@/components/financeiro";
import { OrderItemsView } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useContasPagarTranslation } from "@/hooks/useContasPagarTranslation";
import { FornecedorBreakdown } from "@/types/database";

interface ContaPagar {
  id: string;
  numero_encomenda: string;
  fornecedor_id: string;
  fornecedores: { nome: string } | null;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  data_criacao: string;
  status: string;
  etiqueta: string;
  encomenda_id: string;
  sinal_pago?: boolean;
  custo_frete?: number | null;
}

interface LinhaPagavel {
  id: string;
  custoId?: string | null;
  itemEncomendaId?: string | null;
  fieldKey?: keyof FornecedorBreakdown;
  key: string;
  label: string;
  icon: React.ElementType;
  previsto: number;
  pago: number;
  saldo: number;
  moeda: "BRL" | "EUR";
  fornecedorSugeridoId?: string | null;
  suggestedFornecedor?: { id: string; nome: string } | null;
}

interface ItemResumoPagavel extends LinhaPagavel {
  lineItems: LinhaPagavel[];
  multipleFornecedores: boolean;
}

interface SelectedPaymentItem {
  id?: string;
  itemEncomendaId?: string | null;
  lineItems?: Array<{
    id?: string;
    itemEncomendaId?: string | null;
    saldo: number;
  }>;
  key: string;
  label: string;
  moeda: "BRL" | "EUR";
  saldo: number;
  fornecedorSugeridoId?: string | null;
  fornecedorFixo?: { id: string; nome: string } | null;
}

interface ItemLookupRow {
  id: string;
  quantidade: number | null;
  produtos?: { nome?: string | null } | { nome?: string | null }[] | null;
}

const ITEM_CONFIG: Record<string, { label: string; icon: React.ElementType; moeda: "BRL" | "EUR"; suggestedFornecedor?: { id: string; nome: string } }> = {
  garrafa: { label: "Garrafa", icon: Package, moeda: "BRL" },
  tampa: { label: "Tampa", icon: Droplets, moeda: "BRL" },
  rotulo: { label: "Rótulo", icon: Tag, moeda: "BRL" },
  producao: { label: "Produção", icon: Factory, moeda: "BRL" },
  frete_sp: { label: "Frete SP", icon: Truck, moeda: "BRL" },
  embalagem: { label: "Embalagem", icon: Hand, moeda: "BRL" },
  imposto: { label: "Imposto", icon: ReceiptIcon, moeda: "BRL" },
  diversos: { label: "Diversos", icon: CircleDollarSign, moeda: "BRL" },
  frete_internacional: { label: "Frete Internacional", icon: Ship, moeda: "EUR" },
};

const FIELD_TO_ITEM_KEY: Record<string, string> = {
  garrafa: "garrafa",
  tampa: "tampa",
  rotulo: "rotulo",
  producao_nonato: "producao",
  frete_sp: "frete_sp",
  embalagem_carol: "embalagem",
  imposto: "imposto",
  diversos: "diversos",
};

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const [paymentCounts, setPaymentCounts] = useState<Record<string, number>>({});
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPaymentConta, setSelectedPaymentConta] = useState<ContaPagar | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itensData, setItensData] = useState<Record<string, LinhaPagavel[]>>({});
  const [selectedItem, setSelectedItem] = useState<SelectedPaymentItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedPaymentItem[] | null>(null);
  const [selectedGroupLabel, setSelectedGroupLabel] = useState<string | null>(null);
  const [savingFornecedorLine, setSavingFornecedorLine] = useState<string | null>(null);
  const { toast } = useToast();

  const { t, isHam, isFelipe } = useContasPagarTranslation();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    };
    getUser();
  }, []);

  const fetchItensForOrders = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) return;

    const { data: custos } = await supabase
      .from("custos_producao_encomenda")
      .select("id, encomenda_id, item_encomenda_id, produto_id, garrafa, tampa, producao_nonato, embalagem_carol, imposto, frete_sp, rotulo, diversos, fornecedor_breakdown")
      .in("encomenda_id", orderIds);

    const itemIds = (custos || []).map(c => c.item_encomenda_id).filter(Boolean);
    const { data: itensData } = itemIds.length > 0
      ? await supabase
          .from("itens_encomenda")
          .select("id, quantidade, produtos(nome)")
          .in("id", itemIds)
      : { data: [] };
    const itemById: Record<string, { quantidade: number; produtoNome?: string | null }> = {};
    ((itensData || []) as ItemLookupRow[]).forEach((item) => {
      const produto = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
      itemById[item.id] = {
        quantidade: item.quantidade || 0,
        produtoNome: produto?.nome ?? null,
      };
    });

    const { data: pagamentos } = await supabase
      .from("pagamentos_fornecedor")
      .select("encomenda_id, item_encomenda_id, item_tipo, valor_pagamento, moeda")
      .in("encomenda_id", orderIds);

    const { data: encomendasData } = await supabase
      .from("encomendas")
      .select("id, custo_frete")
      .in("id", orderIds);
    const freteByOrder: Record<string, number> = {};
    (encomendasData || []).forEach(e => { freteByOrder[e.id] = e.custo_frete || 0; });

    const fornecedorIds = Array.from(
      new Set(
        (custos || []).flatMap((c) =>
          Object.values((c.fornecedor_breakdown as FornecedorBreakdown | null) || {})
            .filter((id): id is string => Boolean(id))
        )
      )
    );
    const { data: fornecedoresData } = fornecedorIds.length > 0
      ? await supabase
          .from("fornecedores")
          .select("id, nome")
          .in("id", fornecedorIds)
      : { data: [] };
    const fornecedorById: Record<string, { id: string; nome: string }> = {};
    (fornecedoresData || []).forEach((fornecedor) => {
      fornecedorById[fornecedor.id] = fornecedor;
    });

    const result: Record<string, LinhaPagavel[]> = {};

    for (const orderId of orderIds) {
      const orderCustos = (custos || []).filter(c => c.encomenda_id === orderId);
      const orderPagamentos = (pagamentos || []).filter(p => p.encomenda_id === orderId);
      const fallbackPaidByTipo: Record<string, number> = {};
      const paidByLine: Record<string, number> = {};

      for (const pag of orderPagamentos) {
        if (!pag.item_tipo) continue;
        if (pag.item_encomenda_id) {
          const lineKey = `${pag.item_encomenda_id}-${pag.item_tipo}`;
          paidByLine[lineKey] = (paidByLine[lineKey] || 0) + pag.valor_pagamento;
        } else {
          fallbackPaidByTipo[pag.item_tipo] = (fallbackPaidByTipo[pag.item_tipo] || 0) + pag.valor_pagamento;
        }
      }

      const lines: LinhaPagavel[] = [];

      for (const custo of orderCustos) {
        const itemInfo = itemById[custo.item_encomenda_id];
        const qty = itemInfo?.quantidade || 1;
        const fb = (custo.fornecedor_breakdown as FornecedorBreakdown | null) || {};

        for (const [field, itemKey] of Object.entries(FIELD_TO_ITEM_KEY)) {
          const unitValue = (custo as Record<string, unknown>)[field] as number || 0;
          if (!unitValue) continue;

          const config = ITEM_CONFIG[itemKey];
          const previsto = unitValue * qty;
          const specificPaid = paidByLine[`${custo.item_encomenda_id}-${itemKey}`] || 0;
          const fallbackAvailable = fallbackPaidByTipo[itemKey] || 0;
          const fallbackApplied = Math.min(Math.max(previsto - specificPaid, 0), fallbackAvailable);
          fallbackPaidByTipo[itemKey] = fallbackAvailable - fallbackApplied;
          const pago = specificPaid + fallbackApplied;
          const fornecedorId = fb[field as keyof FornecedorBreakdown] || null;
        const productSuffix = itemInfo?.produtoNome ? ` - ${itemInfo.produtoNome}` : "";

          lines.push({
            id: `${custo.item_encomenda_id}-${itemKey}`,
            custoId: custo.id,
            itemEncomendaId: custo.item_encomenda_id,
            fieldKey: field as keyof FornecedorBreakdown,
            key: itemKey,
            label: `${config.label}${productSuffix}`,
            icon: config.icon,
            previsto,
            pago,
            saldo: previsto - pago,
            moeda: config.moeda,
            fornecedorSugeridoId: fornecedorId,
            suggestedFornecedor: fornecedorId ? fornecedorById[fornecedorId] ?? null : null,
          });
        }
      }

      const fretePrevisto = freteByOrder[orderId] || 0;
      if (fretePrevisto > 0) {
        const specificPaid = paidByLine[`${orderId}-frete_internacional`] || 0;
        const fallbackPaid = fallbackPaidByTipo.frete_internacional || 0;
        const pago = specificPaid + fallbackPaid;
        lines.push({
          id: `${orderId}-frete_internacional`,
          custoId: null,
          itemEncomendaId: null,
          key: "frete_internacional",
          label: ITEM_CONFIG.frete_internacional.label,
          icon: ITEM_CONFIG.frete_internacional.icon,
          previsto: fretePrevisto,
          pago,
          saldo: fretePrevisto - pago,
          moeda: ITEM_CONFIG.frete_internacional.moeda,
          fornecedorSugeridoId: null,
          suggestedFornecedor: null,
        });
      }

      result[orderId] = lines;
    }

    setItensData(result);
  }, []);

  const fetchContas = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("encomendas")
        .select(
          `
          id,
          numero_encomenda,
          fornecedor_id,
          fornecedores ( nome ),
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          custo_frete,
          sinal_pago,
          data_criacao,
          status,
          etiqueta
        `
        );

      if (!showCompleted) {
        query = query.gt("saldo_devedor_fornecedor", 0.01);
      }

      if (isFelipe) {
        query = query.in("fornecedor_id", [
          "f0920a27-752c-4483-ba02-e7f32beceef6",
          "b8f995d2-47dc-4c8f-9779-ce21431f5244",
        ]);
      }

      const { data, error } = await query.order("data_criacao", { ascending: false });

      if (error) throw error;

      const contasPagar: ContaPagar[] = (data || []).map((item) => {
        const row = item as unknown as ContaPagar;
        return {
          ...row,
          encomenda_id: row.id,
        };
      });
      setContas(contasPagar);

      const orderIds = contasPagar.map(c => c.id);
      fetchItensForOrders(orderIds);
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [showCompleted, isFelipe, toast, fetchItensForOrders]);

  useEffect(() => {
    fetchContas();
  }, [showCompleted, fetchContas]);

  const handlePaymentSuccess = () => {
    fetchContas();
    toast({
      title: "Sucesso",
      description: "Pagamento registrado com sucesso",
    });
  };

  const handleViewDetails = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setShowDetails(true);
  };

  const handleAttachmentChange = () => {
    fetchContas();
    loadAttachmentCounts();
    loadPaymentCounts();
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildPaymentItem = (item: ItemResumoPagavel): SelectedPaymentItem => ({
    id: item.id,
    itemEncomendaId: item.itemEncomendaId,
    key: item.key,
    label: item.label,
    moeda: item.moeda,
    saldo: Math.max(item.saldo, 0),
    fornecedorSugeridoId: item.fornecedorSugeridoId,
    fornecedorFixo: item.suggestedFornecedor,
    lineItems: item.lineItems.map((line) => ({
      id: line.id,
      itemEncomendaId: line.itemEncomendaId,
      saldo: Math.max(line.saldo, 0),
    })),
  });

  const handleFornecedorLineChange = async (item: ItemResumoPagavel, fornecedorId: string | null) => {
    const editableLines = item.lineItems.filter((line) => line.custoId && line.fieldKey);

    if (editableLines.length === 0) {
      toast({
        title: "Fornecedor não salvo",
        description: "Este item não tem uma linha de custo editável.",
        variant: "destructive",
      });
      return;
    }

    setSavingFornecedorLine(item.id);
    try {
      await Promise.all(
        editableLines.map(async (line) => {
          const { data, error: fetchError } = await supabase
            .from("custos_producao_encomenda")
            .select("fornecedor_breakdown")
            .eq("id", line.custoId)
            .single();

          if (fetchError) throw fetchError;

          const current = (data?.fornecedor_breakdown as FornecedorBreakdown | null) || {};
          const next: FornecedorBreakdown = { ...current, [line.fieldKey!]: fornecedorId };

          const { error } = await supabase
            .from("custos_producao_encomenda")
            .update({ fornecedor_breakdown: next })
            .eq("id", line.custoId);

          if (error) throw error;
        })
      );

      await fetchContas();
      toast({ title: "Fornecedor atualizado", description: "A visão por fornecedor foi recalculada." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar fornecedor";
      toast({ title: "Erro ao atualizar fornecedor", description: message, variant: "destructive" });
    } finally {
      setSavingFornecedorLine(null);
    }
  };

  const loadAttachmentCounts = useCallback(async () => {
    if (contas.length === 0) return;
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        contas.map(async (conta) => {
          const { count, error } = await supabase
            .from("attachments")
            .select("*", { count: "exact", head: true })
            .eq("entity_type", "payable")
            .eq("entity_id", conta.id);
          if (!error) counts[conta.id] = count || 0;
        })
      );
      setAttachmentCounts(counts);
    } catch (error) {
      console.error("Error loading attachment counts:", error);
    }
  }, [contas]);

  const loadPaymentCounts = useCallback(async () => {
    if (contas.length === 0) return;
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        contas.map(async (conta) => {
          const { data, error } = await supabase
            .from("pagamentos_fornecedor")
            .select("id, payment_batch_id")
            .eq("encomenda_id", conta.id);
          if (!error) {
            counts[conta.id] = new Set((data || []).map((payment) => payment.payment_batch_id || payment.id)).size;
          }
        })
      );
      setPaymentCounts(counts);
    } catch (error) {
      console.error("Error loading payment counts:", error);
    }
  }, [contas]);

  useEffect(() => {
    if (contas.length > 0) {
      loadAttachmentCounts();
      loadPaymentCounts();
    }
  }, [contas, loadAttachmentCounts, loadPaymentCounts]);

  // Render the expanded item cards for an order
  const renderItemCards = (conta: ContaPagar) => {
    const items = itensData[conta.id];
    if (!items) return null;

    const itemSummaries = Object.values(items.reduce<Record<string, ItemResumoPagavel>>((acc, line) => {
      const summaryKey = `${line.key}-${line.moeda}`;
      const existing = acc[summaryKey];
      const fornecedorId = line.suggestedFornecedor?.id || line.fornecedorSugeridoId || null;

      if (!existing) {
        acc[summaryKey] = {
          ...line,
          id: summaryKey,
          label: ITEM_CONFIG[line.key]?.label || line.label,
          itemEncomendaId: null,
          previsto: line.previsto,
          pago: line.pago,
          saldo: line.saldo,
          fornecedorSugeridoId: fornecedorId,
          suggestedFornecedor: line.suggestedFornecedor || null,
          lineItems: [line],
          multipleFornecedores: false,
        };
        return acc;
      }

      existing.previsto += line.previsto;
      existing.pago += line.pago;
      existing.saldo += line.saldo;
      existing.lineItems.push(line);

      const currentFornecedorId = existing.suggestedFornecedor?.id || existing.fornecedorSugeridoId || null;
      if (currentFornecedorId !== fornecedorId) {
        existing.multipleFornecedores = true;
        existing.fornecedorSugeridoId = null;
        existing.suggestedFornecedor = null;
      }

      return acc;
    }, {}));

    const groups = itemSummaries.reduce<Record<string, {
      label: string;
      fornecedor: { id: string; nome: string } | null;
      moeda: "BRL" | "EUR";
      items: ItemResumoPagavel[];
      totalSaldo: number;
      totalPrevisto: number;
      totalPago: number;
    }>>((acc, item) => {
      const fornecedorId = item.suggestedFornecedor?.id || item.fornecedorSugeridoId || "a-definir";
      const label = item.suggestedFornecedor?.nome || "A definir";
      const key = `${fornecedorId}-${item.moeda}`;
      if (!acc[key]) {
        acc[key] = {
          label,
          fornecedor: item.suggestedFornecedor || null,
          moeda: item.moeda,
          items: [],
          totalSaldo: 0,
          totalPrevisto: 0,
          totalPago: 0,
        };
      }
      acc[key].items.push(item);
      acc[key].totalSaldo += Math.max(item.saldo, 0);
      acc[key].totalPrevisto += item.previsto;
      acc[key].totalPago += item.pago;
      return acc;
    }, {});

    const groupedView = (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Object.values(groups).map((group) => {
            const pendingItems = group.items.filter((item) => item.saldo > 0.01);

            return (
              <div
                key={`${group.label}-${group.moeda}`}
                className="bg-card rounded-xl border border-border/50 p-3 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-500" />
                      <h4 className="truncate text-sm font-black uppercase tracking-wide">
                        {group.label}
                      </h4>
                      <Badge variant="outline" className="text-[9px]">
                        {group.moeda}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {group.items.map((item) => item.label).join(", ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs sm:min-w-[260px]">
                    <div>
                      <span className="text-muted-foreground text-[9px] font-bold uppercase">Previsto</span>
                      <p className="font-semibold tabular-nums">
                        {group.moeda === "BRL" ? formatCurrencyBRL(group.totalPrevisto) : formatCurrencyEUR(group.totalPrevisto)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[9px] font-bold uppercase">Pago</span>
                      <p className="font-bold text-success tabular-nums">
                        {group.moeda === "BRL" ? formatCurrencyBRL(group.totalPago) : formatCurrencyEUR(group.totalPago)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[9px] font-bold uppercase">Saldo</span>
                      <p className="font-black text-warning tabular-nums">
                        {group.moeda === "BRL" ? formatCurrencyBRL(group.totalSaldo) : formatCurrencyEUR(group.totalSaldo)}
                      </p>
                    </div>
                  </div>
                </div>

                {pendingItems.length > 0 && !isFelipe && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full border border-emerald-200/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConta(conta);
                      setSelectedItem(null);
                      setSelectedItems(pendingItems.map(buildPaymentItem));
                      setSelectedGroupLabel(`${group.label} (${group.moeda})`);
                      setShowPaymentForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Pagar grupo
                  </Button>
                )}
              </div>
            );
          })}
      </div>
    );

    const itemView = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {itemSummaries.map((item) => {
            const Icon = item.icon;
            const isPaid = item.saldo <= 0.01 && item.previsto > 0;
            const isPending = item.saldo > 0.01;

            return (
              <div
                key={item.id}
                className={cn(
                  "bg-popover rounded-xl border p-3 space-y-2 transition-all",
                  isPaid
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : isPending
                      ? "border-border/40"
                      : "border-border/20 opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-amber-500/70" />
                    <h4 className="text-xs font-bold">{item.label}</h4>
                  </div>
                  {isPaid && (
                    <Badge className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Pago
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[9px] font-bold uppercase">Previsto</span>
                    <p className="font-semibold tabular-nums">
                      {item.moeda === "BRL" ? formatCurrencyBRL(item.previsto) : formatCurrencyEUR(item.previsto)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[9px] font-bold uppercase">Pago</span>
                    <p className="font-bold text-success tabular-nums">
                      {item.moeda === "BRL" ? formatCurrencyBRL(item.pago) : formatCurrencyEUR(item.pago)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[9px] font-bold uppercase">Saldo</span>
                    <p className={cn("font-black tabular-nums", item.saldo > 0 ? "text-warning" : "text-emerald-500")}>
                      {item.moeda === "BRL" ? formatCurrencyBRL(item.saldo) : formatCurrencyEUR(item.saldo)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground text-[9px] font-bold uppercase">Fornecedor</span>
                  {item.custoId && item.fieldKey && !isFelipe ? (
                    <FornecedorSelect
                      value={item.fornecedorSugeridoId}
                      onChange={(fornecedorId) => handleFornecedorLineChange(item, fornecedorId)}
                      placeholder={item.multipleFornecedores ? "Múltiplos fornecedores" : "A definir"}
                      disabled={savingFornecedorLine === item.id}
                    />
                  ) : (
                    <p className="text-[11px] font-medium text-foreground">
                      {item.multipleFornecedores ? "Múltiplos fornecedores" : item.suggestedFornecedor?.nome || "A definir"}
                    </p>
                  )}
                </div>

                {/* Pay button */}
                {!isFelipe && item.saldo > 0.01 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border border-emerald-200/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 dark:border-emerald-800/30 dark:text-emerald-400 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConta(conta);
                      setSelectedItem(buildPaymentItem(item));
                      setSelectedItems(null);
                      setSelectedGroupLabel(null);
                      setShowPaymentForm(true);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Pagar
                  </Button>
                )}
              </div>
            );
          })}
      </div>
    );

    return (
      <Tabs defaultValue="supplier" className="space-y-4">
        <TabsList className="h-9 rounded-md bg-muted/50 p-1">
          <TabsTrigger value="supplier" className="h-7 gap-1.5 px-3 text-xs">
            <Layers3 className="h-3.5 w-3.5" /> Por fornecedor
          </TabsTrigger>
          <TabsTrigger value="item" className="h-7 gap-1.5 px-3 text-xs">
            <List className="h-3.5 w-3.5" /> Por item
          </TabsTrigger>
        </TabsList>
        <TabsContent value="supplier" className="mt-0">
          {groupedView}
        </TabsContent>
        <TabsContent value="item" className="mt-0">
          {itemView}
        </TabsContent>
      </Tabs>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">{t("Carregando...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (contas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            {t("Nenhuma conta a pagar encontrada")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-card bg-card dark:bg-[#1c202a] border-border/50">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="text-warning h-5 w-5" />
                {t("Compras - Fornecedores")}
              </CardTitle>
              <CardDescription>
                {t("Encomendas com saldo devedor para fornecedores")}
              </CardDescription>
            </div>
            <div className="bg-muted/30 border-border/30 group flex items-center space-x-3 rounded-xl border px-3 py-1.5 shadow-inner">
              <Switch
                id="show-completed-payable"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label
                htmlFor="show-completed-payable"
                className="cursor-pointer text-xs font-semibold tracking-wider uppercase"
              >
                {t("Mostrar Concluídos")}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {/* Desktop table */}
          <div className="border-border/40 bg-popover dark:bg-[#1c202a] hidden overflow-hidden overflow-x-auto rounded-xl border shadow-sm xl:block">
            <Table>
              <TableHeader className="bg-popover border-border/40 border-b">
                <TableRow className="border-b-0 transition-none hover:bg-transparent">
                  <TableHead>{t("Pedido")}</TableHead>
                  <TableHead>{t("Fornecedor")}</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>{t("Valor Total")}</TableHead>
                  <TableHead>{t("Valor Pago")}</TableHead>
                  <TableHead>{t("Saldo")}</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>{t("Ações")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {contas.map((conta) => (
                  <React.Fragment key={conta.id}>
                    <TableRow
                      className="bg-popover hover:bg-muted/30 border-border group cursor-pointer border-b transition-colors last:border-0 dark:border-white/5"
                      onClick={() => toggleExpand(conta.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {expandedRows.has(conta.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex flex-col">
                            <span className="group-hover:text-primary transition-colors">
                              {conta.numero_encomenda}
                            </span>
                            <Badge variant="info" className="mt-0.5 uppercase">
                              {conta.etiqueta || "Nenhum"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{conta.fornecedores?.nome || "N/A"}</TableCell>

                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(conta.data_criacao).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="font-semibold">
                        {formatCurrencyEUR(conta.valor_total_custo)}
                      </TableCell>

                      <TableCell className="text-success">
                        {formatCurrencyEUR(conta.valor_pago_fornecedor)}
                      </TableCell>

                      <TableCell className="text-warning font-semibold">
                        {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
                      </TableCell>

                      <TableCell className="text-muted-foreground text-sm">
                        {paymentCounts[conta.id] > 0 ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary h-auto p-0 underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPaymentConta(conta);
                              setShowPaymentDetails(true);
                            }}
                          >
                            {paymentCounts[conta.id]} pag.
                          </Button>
                        ) : (
                          "Nenhum"
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(conta);
                            }}
                            title={t("Ver Detalhes")}
                            type="button"
                            className="hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {!isFelipe && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("Registrar Pagamento")}
                              type="button"
                              className="hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedConta(conta);
                                setSelectedItem(null);
                                setSelectedItems(null);
                                setSelectedGroupLabel(null);
                                setShowPaymentForm(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}

                          <div onClick={(e) => e.stopPropagation()}>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={t("Anexar Comprovante")}
                                  type="button"
                                >
                                  <IconWithBadge
                                    icon={<Paperclip className="h-4 w-4" />}
                                    count={attachmentCounts[conta.id] || 0}
                                  />
                                </Button>
                              </DialogTrigger>
                              <DialogContent
                                className="bg-background border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
                                aria-describedby=""
                              >
                                <DialogHeader className="mb-4 border-b pb-4">
                                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                    <Paperclip className="text-primary h-5 w-5" />
                                    {t("Anexar Comprovante")}
                                  </DialogTitle>
                                </DialogHeader>
                                <AttachmentManager
                                  entityType="payable"
                                  entityId={conta.id}
                                  title={t("Anexar Comprovante")}
                                  onChanged={handleAttachmentChange}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded row with item cards */}
                    {expandedRows.has(conta.id) && itensData[conta.id] && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="p-0">
                          <div className="bg-muted/20 border-t border-border/40 p-4">
                            {renderItemCards(conta)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}

                {contas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      {t("Nenhuma conta a pagar encontrada")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/tablet cards */}
          <div className="space-y-3 xl:hidden">
            {contas.length === 0 && (
              <Card className="border-dashed shadow-none">
                <CardContent className="text-muted-foreground p-6 text-center">
                  {t("Nenhuma conta a pagar encontrada")}
                </CardContent>
              </Card>
            )}
            {contas.map((conta) => (
              <Card
                key={conta.id}
                className="bg-popover border-border/50 cursor-pointer overflow-hidden transition-all active:scale-[0.98]"
                onClick={() => toggleExpand(conta.id)}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {expandedRows.has(conta.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          #{conta.numero_encomenda}
                        </div>
                        <Badge variant="info" className="mt-0.5 uppercase">
                          {conta.etiqueta || "Nenhum"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0 text-sm">
                      {new Date(conta.data_criacao).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="truncate text-sm">{conta.fornecedores?.nome || "N/A"}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">{t("Valor Total")}</div>
                      <div className="font-semibold">
                        {formatCurrencyEUR(conta.valor_total_custo)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t("Valor Pago")}</div>
                      <div className="text-success">
                        {formatCurrencyEUR(conta.valor_pago_fornecedor)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t("Saldo")}</div>
                      <div className="text-warning font-semibold">
                        {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {paymentCounts[conta.id] > 0 ? (
                      <button
                        className="text-primary cursor-pointer underline"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedPaymentConta(conta);
                          setShowPaymentDetails(true);
                        }}
                      >
                        {paymentCounts[conta.id]} pag.
                      </button>
                    ) : (
                      "Nenhum"
                    )}
                  </div>

                  {/* Expanded item cards for mobile */}
                  {expandedRows.has(conta.id) && itensData[conta.id] && (
                    <div className="pt-2 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                      {renderItemCards(conta)}
                    </div>
                  )}

                  <div
                    className="flex flex-col gap-2 pt-1 sm:flex-row"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border border-sky-200/30 bg-sky-500/5 text-sky-600 hover:bg-sky-500/10 sm:w-auto dark:border-sky-800/30 dark:text-sky-400"
                      onClick={() => handleViewDetails(conta)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> {t("Ver Detalhes")}
                    </Button>
                    {!isFelipe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-emerald-200/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 sm:w-auto dark:border-emerald-800/30 dark:text-emerald-400"
                        onClick={() => {
                          setSelectedConta(conta);
                          setSelectedItem(null);
                          setSelectedItems(null);
                          setSelectedGroupLabel(null);
                          setShowPaymentForm(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> {t("Registrar Pagamento")}
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-purple-200/30 bg-purple-500/5 text-purple-600 hover:bg-purple-500/10 sm:w-auto dark:border-purple-800/30 dark:text-purple-400"
                          title={t("Anexar Comprovante")}
                        >
                          <IconWithBadge
                            icon={<Paperclip className="h-4 w-4" />}
                            count={attachmentCounts[conta.id] || 0}
                          />
                          <span className="ml-2">Anexos</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="bg-background border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
                        aria-describedby={undefined}
                      >
                        <DialogHeader className="mb-4 border-b pb-4">
                          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Paperclip className="text-primary h-5 w-5" />
                            {t("Anexar Comprovante")}
                          </DialogTitle>
                        </DialogHeader>
                        <AttachmentManager
                          entityType="payable"
                          entityId={conta.id}
                          title={t("Anexar Comprovante")}
                          onChanged={handleAttachmentChange}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Registrar Pagamento Fornecedor */}
      {!isFelipe && selectedConta && (
        <Dialog open={showPaymentForm} onOpenChange={(open) => {
          setShowPaymentForm(open);
          if (!open) {
            setSelectedItem(null);
            setSelectedItems(null);
            setSelectedGroupLabel(null);
          }
        }}>
          <DialogContent
            className="bg-card border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
            aria-describedby=""
          >
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Plus className="text-primary h-5 w-5" />
                {t("Registrar Pagamento")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Registre um novo pagamento para o fornecedor deste pedido.
              </DialogDescription>
            </DialogHeader>
            <PagamentoFornecedorForm
              conta={{ ...selectedConta, encomenda_id: selectedConta.id }}
              selectedItem={selectedItem || undefined}
              selectedItems={selectedItems || undefined}
              selectedGroupLabel={selectedGroupLabel || undefined}
              onSuccess={() => {
                handlePaymentSuccess();
                setShowPaymentForm(false);
                setSelectedItem(null);
                setSelectedItems(null);
                setSelectedGroupLabel(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Detalhes + Anexos */}
      {selectedConta && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent
            className="bg-card border-border max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto"
            aria-describedby=""
          >
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Eye className="text-primary h-5 w-5" />
                {t("Detalhes da Conta a Pagar")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Confira todas as informações financeiras desta compra.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Pedido")}:
                  </span>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    #{selectedConta.numero_encomenda}
                    {selectedConta.etiqueta && (
                      <Badge variant="info" className="uppercase">{selectedConta.etiqueta}</Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Fornecedor")}:
                  </span>
                  <p className="text-sm font-semibold">
                    {selectedConta.fornecedores?.nome || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Data")}:
                  </span>
                  <p className="text-sm font-semibold italic">
                    {new Date(selectedConta.data_criacao).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Status")}:
                  </span>
                  <div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary bg-primary/5"
                    >
                      {selectedConta.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Valor Total")}:
                  </span>
                  <p className="text-sm font-bold">
                    {formatCurrencyEUR(selectedConta.valor_total_custo)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Valor Pago")}:
                  </span>
                  <p className="text-success text-sm font-bold">
                    {formatCurrencyEUR(selectedConta.valor_pago_fornecedor)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Saldo")}:
                  </span>
                  <p className="text-warning text-sm font-black">
                    {formatCurrencyEUR(selectedConta.saldo_devedor_fornecedor)}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <OrderItemsView encomendaId={selectedConta.id} showCostPrices={true} />
              </div>

              <div className="border-border/40 border-t pt-6">
                <AttachmentManager
                  entityType="payable"
                  entityId={selectedConta.id}
                  title={t("Comprovantes e Anexos")}
                  onChanged={handleAttachmentChange}
                  useTertiaryLayer={true}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de detalhes dos pagamentos */}
      {selectedPaymentConta && (
        <PaymentDetailsModal
          isOpen={showPaymentDetails}
          onClose={() => {
            setShowPaymentDetails(false);
            setSelectedPaymentConta(null);
          }}
          encomendaId={selectedPaymentConta.id}
          encomendaNumber={selectedPaymentConta.numero_encomenda}
          paymentType="fornecedor"
          isHam={isHam}
        />
      )}
    </div>
  );
}
