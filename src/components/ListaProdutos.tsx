
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProdutoCard } from "@/components/ProdutoCard";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_custo: number;
  preco_venda: number;
  size_weight: number;
  fornecedor_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  fornecedor?: {
    nome: string;
  };
}

interface ListaProdutosRef {
  fetchProdutos: () => void;
}

export const ListaProdutos = forwardRef<ListaProdutosRef>((props, ref) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProdutos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          *,
          fornecedor:fornecedores(nome)
        `)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;

      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchProdutos,
  }));

  useEffect(() => {
    fetchProdutos();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {produtos.map((produto) => (
        <ProdutoCard 
          key={produto.id} 
          produto={produto} 
          onUpdate={fetchProdutos}
        />
      ))}
    </div>
  );
});

ListaProdutos.displayName = "ListaProdutos";
