import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Factory,
  RefreshCw,
  Package,
} from "lucide-react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { CustoProducaoEncomenda, CustoBreakdown } from "@/types/database";
import { CustoProducaoForm } from "./CustoProducaoForm";
import type { ItemEncomenda } from "./ItensEncomendaManager";

interface GestaoProducaoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encomendaId: string;
  itens: ItemEncomenda[];
}

interface ItemComCusto {
  item: ItemEncomenda;
  custo: CustoProducaoEncomenda | null;
  custoAnterior: number; 
}

export function GestaoProducaoSheet({
  open,
  onOpenChange,
  encomendaId,
  itens,
}: GestaoProducaoSheetProps) {
  const [custosProducao, setCustosProducao] = useState<CustoProducaoEncomenda[]>([]);
  const [loading, setLoading] = useState(false);
  const [produtosData, setProdutosData] = useState<Record<string, { size_weight?: number, custo_producao?: number, custo_nonato_breakdown?: CustoBreakdown | null }>>({});

  const fetchCustos = useCallback(async () => {
    if (!encomendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("custos_producao_encomenda")
      .select("*")
      .eq("encomenda_id", encomendaId);
    if (data) setCustosProducao(data as CustoProducaoEncomenda[]);

    const pIds = itens.filter((i) => !i.is_bonificacao && i.preco_venda > 0 && i.produto_id).map((i) => i.produto_id);
    if (pIds.length > 0) {
      const { data: pData } = await supabase
        .from("produtos")
        .select("id, custo_producao, size_weight, custo_nonato_breakdown")
        .in("id", pIds);
      if (pData) {
        const pMap: Record<string, any> = {};
        pData.forEach((p) => pMap[p.id] = p);
        setProdutosData(pMap);
      }
    }

    setLoading(false);
  }, [encomendaId, itens]);

  useEffect(() => {
    if (open) fetchCustos();
  }, [open, fetchCustos]);

  const itensReais = useMemo(
    () => itens.filter((i) => !i.is_bonificacao && i.preco_venda > 0 && i.produto_id),
    [itens]
  );

  const itensComCusto: ItemComCusto[] = useMemo(
    () =>
      itensReais.map((item) => ({
        item,
        custo: custosProducao.find((c) => c.item_encomenda_id === item.id) || null,
        custoAnterior: item.preco_custo || 0,
      })),
    [itensReais, custosProducao]
  );

  // Totals
  const totais = useMemo(() => {
    const totalVenda = itensReais.reduce(
      (sum, i) => sum + (parseInt(i.quantidade) || 0) * i.preco_venda,
      0
    );
    const comissaoEstimada = itensComCusto.reduce((sum, { item, custo }) => {
      if (!custo) return sum;
      const qty = parseInt(item.quantidade) || 0;
      return sum + qty * custo.lucro_joel_real;
    }, 0);
    const itensFilled = itensComCusto.filter((i) => i.custo).length;
    const total = itensReais.length;
    const commissionType: "estimado" | "parcial" | "real" =
      itensFilled === 0 ? "estimado" : itensFilled >= total ? "real" : "parcial";
    return { totalVenda, comissaoEstimada, itensFilled, total, commissionType };
  }, [itensComCusto, itensReais]);

  const handleDrillDownSaved = () => {
    fetchCustos();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-card w-full overflow-y-auto border-none sm:max-w-[7xl] lg:w-[95vw] lg:max-w-none"
      >
        <div className="mx-auto max-w-7xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-primary">
              <Factory className="h-5 w-5" />
              Gestão de Produção
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Defina os custos granulares e calcule as margens de lucro reais para cada item da encomenda.
            </SheetDescription>
          </SheetHeader>

          {/* Resumo no topo */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/30 bg-muted/30 px-3 py-2.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Itens Preenchidos
              </div>
              <div className="mt-1 text-xl font-bold text-foreground flex items-baseline justify-center gap-1">
                {totais.itensFilled}
                <span className="text-sm font-medium text-muted-foreground">/{totais.total}</span>
              </div>
            </div>
            <div className="rounded-lg border border-border/30 bg-muted/30 px-3 py-2.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Venda
              </div>
              <div className="mt-1 text-xl font-bold text-primary tabular-nums">
                {formatCurrencyEUR(totais.totalVenda)}
              </div>
            </div>
            <div
              className={cn(
                "rounded-lg border px-3 py-2.5 text-center transition-colors",
                totais.comissaoEstimada >= 0
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider",
                    totais.comissaoEstimada >= 0 ? "text-emerald-500/80" : "text-red-500/80"
                  )}
                >
                  Comissão Global
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-1 py-0 text-[8px] font-semibold uppercase leading-3",
                    totais.commissionType === "real" && "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
                    totais.commissionType === "parcial" && "border-blue-500/50 bg-blue-500/10 text-blue-500",
                    totais.commissionType === "estimado" && "border-amber-500/50 bg-amber-500/10 text-amber-500"
                  )}
                >
                  {totais.commissionType === "real" ? "Real" : totais.commissionType === "parcial" ? "Parcial" : "Estimado"}
                </Badge>
              </div>
              <div
                className={cn(
                  "mt-1 text-xl font-bold tabular-nums",
                  totais.comissaoEstimada >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {formatCurrencyEUR(totais.comissaoEstimada)}
              </div>
            </div>
          </div>

          {/* Botão refresh */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Itens da Encomenda
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchCustos}
              disabled={loading}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/80"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar Grid
            </Button>
          </div>

          {/* Lista de itens com formulários embutidos */}
          <div className="space-y-4 pb-10">
            {itensComCusto.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-16 text-muted-foreground bg-muted/10">
                <Package className="mb-3 h-12 w-12 opacity-30" />
                <p className="font-medium text-sm">Nenhum item elegível para gestão de custos</p>
                <p className="text-xs opacity-60 mt-1 max-w-sm text-center">
                  Somente itens com preço de venda maior que 0€ e não marcados como bonificação aparecerão nesta listagem de custos.
                </p>
              </div>
            ) : (
              itensComCusto.map(({ item, custo }) => {
                const qty = parseInt(item.quantidade) || 0;
                const isFilled = !!custo;
                const prodData = produtosData[item.produto_id];

                return (
                  <div
                    key={item.id || item.tempId}
                    className={cn(
                      "w-full rounded-xl border p-4 sm:p-5 transition-all relative overflow-hidden",
                      isFilled
                        ? "border-emerald-500/20 bg-card shadow-sm"
                        : "border-border/50 bg-muted/20 hover:bg-muted/30 hover:border-border/80",
                      !item.id && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isFilled && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500/60 to-emerald-400/40" />
                    )}
                    {item.id && (
                      <CustoProducaoForm
                        encomendaId={encomendaId}
                        itemEncomendaId={item.id}
                        produtoId={item.produto_id}
                        produtoNome={item.produto_nome || "Produto sem Nome"}
                        precoVenda={item.preco_venda || 0}
                        quantidade={qty}
                        sizeWeight={prodData?.size_weight ?? item.peso_produto ?? undefined}
                        custoProducao={prodData?.custo_producao ?? undefined}
                        breakdownDefault={(prodData?.custo_nonato_breakdown as CustoBreakdown | null) ?? null}
                        existingCusto={custo}
                        onSaved={handleDrillDownSaved}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
