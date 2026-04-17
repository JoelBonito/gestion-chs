import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Scale, Search, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR, formatCurrencyBRL, eurToBrl } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useFinanceiroTranslation } from "@/hooks/useFinanceiroTranslation";
import { cn } from "@/lib/utils";

interface SaldoRow {
  id: string;
  numero_encomenda: string;
  etiqueta: string | null;
  cliente_nome: string;
  status: string;
  valor_pago: number;
  valor_pago_fornecedor: number;
  valor_a_receber: number;
  valor_a_pagar: number;
  exposicao: number;
  saldo_liquido: number;
}

type SortKey = "numero" | "cliente" | "a_receber" | "a_pagar" | "exposicao" | "saldo";
type SortDir = "asc" | "desc";

export default function SaldoEncomendas() {
  const { t } = useFinanceiroTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<SaldoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("exposicao");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchSaldo = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          id,
          numero_encomenda,
          etiqueta,
          status,
          saldo_devedor,
          saldo_devedor_fornecedor,
          valor_total,
          valor_pago,
          valor_total_custo,
          valor_pago_fornecedor,
          clientes!inner(nome)
        `
        )
        .or("saldo_devedor.gt.0.01,saldo_devedor_fornecedor.gt.0.01")
        .order("data_criacao", { ascending: false })
        .limit(500);

      if (error) throw error;

      const mapped: SaldoRow[] = (data || []).map((e) => {
        const pagoCliente = Number(e.valor_pago || 0);
        const pagoFornecedor = Number(e.valor_pago_fornecedor || 0);
        const aReceber =
          Number(e.saldo_devedor ?? 0) ||
          Math.max(Number(e.valor_total || 0) - pagoCliente, 0);
        const aPagar =
          Number(e.saldo_devedor_fornecedor ?? 0) ||
          Math.max(Number(e.valor_total_custo || 0) - pagoFornecedor, 0);
        const exposicao = Math.max(pagoFornecedor - pagoCliente, 0);
        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          etiqueta: e.etiqueta ?? null,
          cliente_nome: e.clientes?.nome ?? "",
          status: e.status,
          valor_pago: pagoCliente,
          valor_pago_fornecedor: pagoFornecedor,
          valor_a_receber: aReceber,
          valor_a_pagar: aPagar,
          exposicao,
          saldo_liquido: aReceber - aPagar,
        };
      });

      setRows(mapped);
      setSelected(new Set());
    } catch (err) {
      console.error("Erro ao carregar saldo por encomenda:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o saldo por encomenda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSaldo();
  }, [fetchSaldo]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.numero_encomenda.toLowerCase().includes(q) ||
            r.cliente_nome.toLowerCase().includes(q) ||
            (r.etiqueta ?? "").toLowerCase().includes(q)
        )
      : rows;

    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "numero":
          return a.numero_encomenda.localeCompare(b.numero_encomenda) * dir;
        case "cliente":
          return a.cliente_nome.localeCompare(b.cliente_nome) * dir;
        case "a_receber":
          return (a.valor_a_receber - b.valor_a_receber) * dir;
        case "a_pagar":
          return (a.valor_a_pagar - b.valor_a_pagar) * dir;
        case "exposicao":
          return (a.exposicao - b.exposicao) * dir;
        case "saldo":
        default:
          return (Math.abs(a.saldo_liquido) - Math.abs(b.saldo_liquido)) * dir;
      }
    });
    return sorted;
  }, [rows, search, sortKey, sortDir]);

  const totalsSource = useMemo(() => {
    if (selected.size === 0) return filteredSorted;
    return filteredSorted.filter((r) => selected.has(r.id));
  }, [filteredSorted, selected]);

  const totals = useMemo(() => {
    return totalsSource.reduce(
      (acc, r) => ({
        a_receber: acc.a_receber + r.valor_a_receber,
        a_pagar: acc.a_pagar + r.valor_a_pagar,
        exposicao: acc.exposicao + r.exposicao,
        saldo: acc.saldo + r.saldo_liquido,
      }),
      { a_receber: 0, a_pagar: 0, exposicao: 0, saldo: 0 }
    );
  }, [totalsSource]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "saldo" || key === "a_receber" || key === "a_pagar" || key === "exposicao"
          ? "desc"
          : "asc"
      );
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    filteredSorted.length > 0 && filteredSorted.every((r) => selected.has(r.id));
  const someVisibleSelected =
    !allVisibleSelected && filteredSorted.some((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredSorted.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filteredSorted.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const saldoColorClass = (v: number) =>
    Math.abs(v) < 0.01
      ? "text-muted-foreground"
      : v > 0
        ? "text-success"
        : "text-destructive";

  const DualCurrency = ({
    valueEur,
    primaryClass,
    hideWhenZero = false,
  }: {
    valueEur: number;
    primaryClass?: string;
    hideWhenZero?: boolean;
  }) => {
    if (hideWhenZero && Math.abs(valueEur) < 0.01) {
      return <span className="text-muted-foreground">—</span>;
    }
    return (
      <div className="flex flex-col leading-tight">
        <span className={cn("font-semibold", primaryClass)}>{formatCurrencyEUR(valueEur)}</span>
        <span className="text-muted-foreground text-xs">{formatCurrencyBRL(eurToBrl(valueEur))}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">{t("Carregando saldo...")}</p>
        </CardContent>
      </Card>
    );
  }

  const totalsLabel =
    selected.size > 0
      ? `${t("Totais selecionados")} (${selected.size})`
      : `${t("Totais")} (${filteredSorted.length})`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-card bg-card dark:bg-[#1c202a] border-border/50">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="text-primary h-5 w-5" />
                {t("Saldo por Encomenda")}
              </CardTitle>
              <CardDescription>
                {t("Visão global das pendências financeiras por encomenda")}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t("Buscar nº, cliente ou etiqueta...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {filteredSorted.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {t("Nenhuma encomenda com pendência encontrada")}
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="border-border/40 bg-popover dark:bg-[#1c202a] hidden overflow-hidden overflow-x-auto rounded-xl border shadow-sm xl:block">
                <Table>
                  <TableHeader className="bg-popover border-border/40 border-b">
                    <TableRow className="border-b-0 transition-none hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            allVisibleSelected
                              ? true
                              : someVisibleSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label={t("Selecionar todas")}
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="hover:text-primary inline-flex items-center gap-1 font-semibold"
                          onClick={() => toggleSort("numero")}
                        >
                          {t("Nº Encomenda")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>{t("Etiqueta")}</TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="hover:text-primary inline-flex items-center gap-1 font-semibold"
                          onClick={() => toggleSort("cliente")}
                        >
                          {t("Cliente")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          type="button"
                          className="hover:text-primary inline-flex items-center gap-1 font-semibold"
                          onClick={() => toggleSort("a_receber")}
                        >
                          {t("Total a Receber")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          type="button"
                          className="hover:text-primary inline-flex items-center gap-1 font-semibold"
                          onClick={() => toggleSort("a_pagar")}
                        >
                          {t("Total a Pagar")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          type="button"
                          className="hover:text-primary inline-flex items-center gap-1 font-semibold"
                          onClick={() => toggleSort("exposicao")}
                          title={t("Capital já desembolsado ao fornecedor e ainda não recebido do cliente")}
                        >
                          {t("Exposição")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">
                        <button
                          type="button"
                          className="hover:text-primary inline-flex items-center gap-1 font-semibold"
                          onClick={() => toggleSort("saldo")}
                        >
                          {t("Saldo Real")} <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredSorted.map((r) => {
                      const isSelected = selected.has(r.id);
                      const hasExposure = r.exposicao > 0.01;
                      return (
                        <TableRow
                          key={r.id}
                          className={cn(
                            "bg-popover hover:bg-muted/30 border-border group border-b transition-colors last:border-0 dark:border-white/5",
                            hasExposure && "bg-destructive/5 hover:bg-destructive/10",
                            isSelected && "bg-primary/10 hover:bg-primary/15"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(r.id)}
                              aria-label={`${t("Selecionar")} ${r.numero_encomenda}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{r.numero_encomenda}</TableCell>
                          <TableCell>
                            <Badge variant="info" className="uppercase">
                              {r.etiqueta || "Nenhum"}
                            </Badge>
                          </TableCell>
                          <TableCell>{r.cliente_nome || "—"}</TableCell>
                          <TableCell className="text-right">
                            <DualCurrency valueEur={r.valor_a_receber} primaryClass="text-warning" />
                          </TableCell>
                          <TableCell className="text-right">
                            <DualCurrency valueEur={r.valor_a_pagar} primaryClass="text-warning" />
                          </TableCell>
                          <TableCell className="text-right">
                            <DualCurrency
                              valueEur={r.exposicao}
                              primaryClass={cn("font-bold", hasExposure && "text-destructive")}
                              hideWhenZero
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DualCurrency
                              valueEur={r.saldo_liquido}
                              primaryClass={cn("font-bold", saldoColorClass(r.saldo_liquido))}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>

                  <TableFooter className="bg-muted/30">
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold uppercase tracking-wider text-xs">
                        {totalsLabel}
                      </TableCell>
                      <TableCell className="text-right">
                        <DualCurrency valueEur={totals.a_receber} primaryClass="text-warning" />
                      </TableCell>
                      <TableCell className="text-right">
                        <DualCurrency valueEur={totals.a_pagar} primaryClass="text-warning" />
                      </TableCell>
                      <TableCell className="text-right">
                        <DualCurrency
                          valueEur={totals.exposicao}
                          primaryClass="font-bold text-destructive"
                          hideWhenZero
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DualCurrency
                          valueEur={totals.saldo}
                          primaryClass={cn("font-black", saldoColorClass(totals.saldo))}
                        />
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Mobile/tablet cards */}
              <div className="space-y-3 xl:hidden">
                {filteredSorted.map((r) => {
                  const isSelected = selected.has(r.id);
                  const hasExposure = r.exposicao > 0.01;
                  return (
                    <Card
                      key={r.id}
                      className={cn(
                        "bg-popover border-border/50 overflow-hidden",
                        hasExposure && "border-destructive/40",
                        isSelected && "ring-2 ring-primary/50"
                      )}
                    >
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(r.id)}
                              aria-label={`${t("Selecionar")} ${r.numero_encomenda}`}
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">
                                #{r.numero_encomenda}
                              </div>
                              <Badge variant="info" className="mt-0.5 uppercase">
                                {r.etiqueta || "Nenhum"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="truncate text-sm">{r.cliente_nome || "—"}</div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                              {t("A Receber")}
                            </div>
                            <DualCurrency valueEur={r.valor_a_receber} primaryClass="text-warning" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                              {t("A Pagar")}
                            </div>
                            <DualCurrency valueEur={r.valor_a_pagar} primaryClass="text-warning" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                              {t("Exposição")}
                            </div>
                            <DualCurrency
                              valueEur={r.exposicao}
                              primaryClass={cn("font-bold", hasExposure && "text-destructive")}
                              hideWhenZero
                            />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                              {t("Saldo")}
                            </div>
                            <DualCurrency
                              valueEur={r.saldo_liquido}
                              primaryClass={cn("font-bold", saldoColorClass(r.saldo_liquido))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Mobile totals */}
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="space-y-2 p-4">
                    <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      {totalsLabel}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase">
                          {t("A Receber")}
                        </div>
                        <DualCurrency valueEur={totals.a_receber} primaryClass="text-warning" />
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase">
                          {t("A Pagar")}
                        </div>
                        <DualCurrency valueEur={totals.a_pagar} primaryClass="text-warning" />
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase">
                          {t("Exposição")}
                        </div>
                        <DualCurrency
                          valueEur={totals.exposicao}
                          primaryClass="font-bold text-destructive"
                          hideWhenZero
                        />
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase">
                          {t("Saldo")}
                        </div>
                        <DualCurrency
                          valueEur={totals.saldo}
                          primaryClass={cn("font-black", saldoColorClass(totals.saldo))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
