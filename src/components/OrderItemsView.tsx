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
  const isCollaborator = useIsCollaborator();
  
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
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">Carregando itens...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Itens da Encomenda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                {shouldShowCostPrices ? <TableHead>Preço Custo</TableHead> : <TableHead>Preço Unitário</TableHead>}
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.produtos ? (
                      <div>
                        <p className="font-medium">{item.produtos.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.produtos.marca} - {item.produtos.tipo}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Produto não encontrado</span>
                    )}
                  </TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>
                    {formatCurrencyEUR(shouldShowCostPrices ? (item.preco_custo || 0) : item.preco_unitario)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrencyEUR(shouldShowCostPrices 
                      ? (item.quantidade * (item.preco_custo || 0))
                      : item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total dos Itens:</p>
              <p className="text-lg font-semibold">
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