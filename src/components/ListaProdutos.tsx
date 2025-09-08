import { useEffect, useState } from "react";
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
  estoque: number;
  ativo?: boolean;   // pode vir como "ativo"
  active?: boolean;  // ou pode vir como "active"
}

interface ListaProdutosProps {
  searchTerm: string;
  sort: "nameAsc" | "nameDesc";
  refreshTrigger: number;
}

export default function ListaProdutos({ searchTerm, sort, refreshTrigger }: ListaProdutosProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProdutos = async () => {
    try {
      setLoading(true);

      // 🔎 primeiro tenta com "ativo"
      let query = supabase
        .from("produtos")
        .select("id, nome, marca, tipo, preco, estoque, ativo", { count: "exact" });

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

      query = query.range(0, 49);

      let { data, error } = await query;

      // 🔄 fallback: se der erro de coluna inexistente, tenta com "active"
      if (error && error.message.includes("ativo")) {
        console.warn("Coluna 'ativo' não existe, tentando com 'active'...");

        let altQuery = supabase
          .from("produtos")
          .select("id, nome, marca, tipo, preco, estoque, active", { count: "exact" });

        if (searchTerm) {
          altQuery = altQuery.or(
            `nome.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%,tipo.ilike.%${searchTerm}%`
          );
        }

        if (sort === "nameAsc") {
          altQuery = altQuery.order("nome", { ascending: true });
        } else {
          altQuery = altQuery.order("nome", { ascending: false });
        }

        altQuery = altQuery.range(0, 49);
        const altRes = await altQuery;
        data = altRes.data;
        error = altRes.error;
      }

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sort, refreshTrigger]);

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
      {produtos.map((produto) => {
        const status = produto.ativo ?? produto.active ?? false;
        return (
          <Card key={produto.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold">{produto.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {produto.marca} - {produto.tipo}
              </p>
              <p className="mt-2 text-sm">Preço: {produto.preco.toFixed(2)}€</p>
              <p className="text-sm">Estoque: {produto.estoque}</p>
              <p className="text-sm">
                Status: {status ? "Ativo ✅" : "Inativo ❌"}
              </p>
              <Button className="mt-3 w-full">Detalhes</Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
