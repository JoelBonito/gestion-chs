import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useLocale } from "@/contexts/LocaleContext";
import { useOrderItemsTranslation } from "@/hooks/useOrderItemsTranslation";

interface OrderItem {
  id: string;
  quantidade: number;
  preco_unitario: number;
  preco_custo: number;
  subtotal: number;
  produto_id: string;
  produtos?: {
    nome: string;
    marca: string;
    tipo: string;
  };
}

interface OrderItemsViewProps {
  encomendaId: string;
  showCostPrices?: boolean;
}

export function OrderItemsView({ encomendaId, showCostPrices = false }: OrderItemsViewProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isCollaborator } = useIsCollaborator();
  const { t } = useOrderItemsTranslation();

  // Se for colaborador, sempre mostrar preços de custo
  const shouldShowCostPrices = showCostPrices || isCollaborator;

  useEffect(() => {
    fetchItems();
  }, [encomendaId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("itens_encomenda")
        .select(
          `
          id,
          quantidade,
          preco_unitario,
          preco_custo,
          subtotal,
          produto_id,
          produtos(nome, marca, tipo)
        `
        )
        .eq("encomenda_id", encomendaId);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-popover border-border/50">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">{t("Carregando itens...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="bg-popover border-border/50">
        <CardHeader>
          <CardTitle>{t("Itens da Encomenda")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center">{t("Nenhum item encontrado")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-popover dark:bg-[#252a36] border-border/30 overflow-hidden shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          {t("Itens da Encomenda")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-border/40 bg-accent dark:bg-[#2d3342] overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader className="bg-accent dark:bg-[#2d3342] border-border/40 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold">{t("Produto")}</TableHead>
                <TableHead className="font-bold">{t("Marca")}</TableHead>
                <TableHead className="font-bold">{t("Tipo")}</TableHead>
                <TableHead className="text-right font-bold">{t("Qtd")}</TableHead>
                <TableHead className="text-right font-bold">
                  {shouldShowCostPrices ? t("Custo Un.") : t("Preço Un.")}
                </TableHead>
                <TableHead className="text-right font-bold">{t("Subtotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/30 border-border border-b transition-colors last:border-0 dark:border-white/5"
                >
                  <TableCell className="text-sm font-semibold uppercase">
                    {item.produtos?.nome || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.produtos?.marca || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase">
                    {item.produtos?.tipo || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {item.quantidade}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrencyEUR(
                      shouldShowCostPrices ? item.preco_custo || 0 : item.preco_unitario || 0
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">
                    {formatCurrencyEUR(
                      shouldShowCostPrices
                        ? item.quantidade * (item.preco_custo || 0)
                        : item.subtotal || 0
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-border/40 mt-6 border-t pt-4">
          <div className="flex justify-end pr-2">
            <div className="text-right">
              <p className="text-muted-foreground mb-1 text-xs font-bold tracking-wider uppercase">
                {t("Total dos Itens:")}
              </p>
              <p className="text-primary text-xl font-black">
                {formatCurrencyEUR(
                  shouldShowCostPrices
                    ? items.reduce(
                      (sum, item) => sum + item.quantidade * (item.preco_custo || 0),
                      0
                    )
                    : items.reduce((sum, item) => sum + item.subtotal, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
