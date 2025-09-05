import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProdutoCard from "@/components/ProdutoCard";
import { logActivity } from "@/utils/activityLogger";
import { Produto } from "@/types/database";

export interface ListaProdutosRef {
  fetchProdutos: () => void;
}

type Props = {
  searchTerm?: string;
  sort?: "nameAsc" | "nameDesc";
};

export const ListaProdutos = forwardRef<ListaProdutosRef, Props>(
  ({ searchTerm = "", sort = "nameAsc" }, ref) => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProdutos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("produtos")
          .select("*"); // você pode ajustar os campos se quiser

        if (error) throw error;
        setProdutos(data || []);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        toast.error("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      fetchProdutos,
    }));

    useEffect(() => {
      fetchProdutos();
    }, []);

    const handleDelete = async (id: string) => {
      try {
        const { error } = await supabase.from("produtos").delete().eq("id", id);
        if (error) throw error;

        await logActivity({ entity: "produto", entity_id: id, action: "delete" });
        setProdutos(produtos.filter((p) => p.id !== id));
        toast.success("Produto excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error("Erro ao excluir produto");
      }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
      try {
        const { error } = await supabase
          .from("produtos")
          .update({ ativo: !currentStatus })
          .eq("id", id);

        if (error) throw error;

        await logActivity({
          entity: "produto",
          entity_id: id,
          action: currentStatus ? "deactivate" : "activate",
        });

        setProdutos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ativo: !currentStatus } : p))
        );

        toast.success(`Produto ${!currentStatus ? "ativado" : "inativado"} com sucesso!`);
      } catch (error) {
        console.error("Erro ao alterar status:", error);
        toast.error("Erro ao alterar status do produto");
      }
    };

    // Filtro local por nome, marca ou tipo
    const filtered = produtos.filter((p) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        p.nome?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.tipo?.toLowerCase().includes(q)
      );
    });

    // Ordenação local por nome
    filtered.sort((a, b) => {
      const nomeA = (a.nome ?? "").toLowerCase();
      const nomeB = (b.nome ?? "").toLowerCase();

      if (nomeA < nomeB) return sort === "nameAsc" ? -1 : 1;
      if (nomeA > nomeB) return sort === "nameAsc" ? 1 : -1;
      return 0;
    });

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground font-body">Nenhum produto encontrado.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((produto) => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            onUpdate={fetchProdutos}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>
    );
  }
);
