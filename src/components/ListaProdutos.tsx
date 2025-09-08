import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_custo: number;
  preco_venda: number;
  size_weight?: number; // ✅ Campo que existe
  ativo: boolean;
  fornecedor_id?: string;
}

interface ListaProdutosProps {
  searchTerm: string;
  sort: "nameAsc" | "nameDesc";
}

export interface ListaProdutosRef {
  fetchProdutos: () => void;
}

const formatCurrencyEUR = (value: number) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);

const ListaProdutos = forwardRef<ListaProdutosRef, ListaProdutosProps>(
  ({ searchTerm, sort }, ref) => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchProdutos = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from("produtos")
          .select("id, nome, marca, tipo, preco_custo, preco_venda, size_weight, ativo, fornecedor_id", { count: "exact" });

        if (searchTerm) {
          query = query.or(
            `nome.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%,tipo.ilike.%${searchTerm}%`
          );
        }

        if (sort === "nameAsc") {
          query = query.order("nome", { ascending: true });
        } else {
          query = query.order("nome", { ascending: false });
        }

        query = query.range(0, 49); // paginação (primeiros 50)

        const { data, error } = await query;

        if (error) {
          console.error(error);
          toast.error("Erro ao carregar produtos");
          setProdutos([]);
          return;
        }

        setProdutos(data || []);
      } catch (error) {
        console.error("Erro inesperado ao carregar produtos:", error);
        toast.error("Erro inesperado ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      fetchProdutos,
    }));

    useEffect(() => {
      fetchProdutos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, sort]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      );
    }

    if (produtos.length === 0) {
      return (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {produtos.map((produto) => (
          <Card key={produto.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold">{produto.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {produto.marca} - {produto.tipo}
              </p>
              <p className="mt-2 text-sm">
                Preço de venda: {formatCurrencyEUR(produto.preco_venda)}
              </p>
              <p className="text-sm text-muted-foreground">
                Custo: {formatCurrencyEUR(produto.preco_custo)}
              </p>
              {produto.size_weight && (
                <p className="text-sm">Peso: {produto.size_weight}g</p>
              )}
              <p className="text-sm">
                Status: {produto.ativo ? "Ativo ✅" : "Inativo ❌"}
              </p>
              <Button className="mt-3 w-full">Detalhes</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
);

ListaProdutos.displayName = "ListaProdutos";

export { ListaProdutos };
