import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { formatCurrencyEUR } from "@/lib/utils/currency";

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
        .select(`
          id,
          quantidade,
          preco_unitario,
          preco_custo,
          subtotal,
          produto_id,
          produtos(nome, marca, tipo)
        `)
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
          <p className="text-muted-foreground">Carregando itens...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="bg-popover border-border/50">
        <CardHeader>
          <CardTitle>Itens da Encomenda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Nenhum item encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-popover border-border/30 overflow-hidden shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          Itens da Encomenda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-border/40 bg-accent shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold">Produto</TableHead>
                <TableHead className="font-bold">Marca</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="text-right font-bold">Qtd</TableHead>
                <TableHead className="text-right font-bold">{shouldShowCostPrices ? 'Custo Un.' : 'Preço Un.'}</TableHead>
                <TableHead className="text-right font-bold">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="bg-popover hover:bg-muted/30 transition-colors border-b border-border dark:border-white/5 last:border-0">
                  <TableCell className="font-semibold text-sm uppercase">
                    {item.produtos?.nome || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.produtos?.marca || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase">
                    {item.produtos?.tipo || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{item.quantidade}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatCurrencyEUR(shouldShowCostPrices ? (item.preco_custo || 0) : (item.preco_unitario || 0))}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-sm">
                    {formatCurrencyEUR(shouldShowCostPrices
                      ? (item.quantidade * (item.preco_custo || 0))
                      : (item.subtotal || 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 pt-4 border-t border-border/40">
          <div className="flex justify-end pr-2">
            <div className="text-right">
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1">Total dos Itens:</p>
              <p className="text-xl font-black text-primary">
                {formatCurrencyEUR(shouldShowCostPrices
                  ? items.reduce((sum, item) => sum + (item.quantidade * (item.preco_custo || 0)), 0)
                  : items.reduce((sum, item) => sum + item.subtotal, 0))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}