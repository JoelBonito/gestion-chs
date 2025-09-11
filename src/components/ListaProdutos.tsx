import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProdutoCard from "@/components/ProdutoCard";
import { logActivity } from "@/utils/activityLogger";
import { Produto } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

export interface ListaProdutosRef {
  fetchProdutos: () => void;
}

type Props = {
  searchTerm?: string;
  sort?: "nameAsc" | "nameDesc";
  limit?: number;
  allowedSupplierIds?: string[] | null;
};

export const ListaProdutos = forwardRef<ListaProdutosRef, Props>(
  ({ searchTerm = "", sort = "nameAsc", limit = 1000, allowedSupplierIds = null }, ref) => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProdutos = useCallback(async () => {
      try {
        setLoading(true);
        let q = supabase
          .from("produtos")
          .select("*")
          .order("nome")
          .limit(limit);

        if (allowedSupplierIds && allowedSupplierIds.length) {
          q = q.in("fornecedor_id", allowedSupplierIds);
        }

        const { data, error } = await q;
        if (error) throw error;
        setProdutos(data || []);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        toast.error("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    }, [limit]);

    useImperativeHandle(ref, () => ({
      fetchProdutos,
    }));

    useEffect(() => {
      fetchProdutos();
    }, []);

    const handleDelete = useCallback(async (id: string) => {
      try {
        const { error } = await supabase.from("produtos").delete().eq("id", id);
        if (error) throw error;

        await logActivity({ entity: "produto", entity_id: id, action: "delete" });
        setProdutos(prev => prev.filter((p) => p.id !== id));
        toast.success("Produto excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error("Erro ao excluir produto");
      }
    }, []);

    const handleToggleActive = useCallback(async (id: string, currentStatus: boolean) => {
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
    }, []);

    // Filtro e ordenacao dos produtos otimizado com useMemo
    const sortedAndFiltered = useMemo(() => {
      const baseProdutos = produtos;
      const scopedProdutos = (allowedSupplierIds && allowedSupplierIds.length)
        ? baseProdutos.filter(p => (p as any).fornecedor_id && allowedSupplierIds!.includes((p as any).fornecedor_id))
        : baseProdutos;

      return scopedProdutos
        .filter((p) => {
          if (!searchTerm.trim()) return true;
          const q = searchTerm.toLowerCase();
          return (
            (p.nome ?? "").toLowerCase().includes(q) ||
            (p.marca ?? "").toLowerCase().includes(q) ||
            (p.tipo ?? "").toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          const nomeA = (a.nome ?? "").toLowerCase();
          const nomeB = (b.nome ?? "").toLowerCase();

          if (nomeA < nomeB) return sort === "nameAsc" ? -1 : 1;
          if (nomeA > nomeB) return sort === "nameAsc" ? 1 : -1;
          return 0;
        });
    }, [produtos, searchTerm, sort, allowedSupplierIds]);

    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      );
    }

    if (sortedAndFiltered.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground font-body">Nenhum produto encontrado.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAndFiltered.map((produto) => (
          <MemoizedProdutoCard
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

ListaProdutos.displayName = "ListaProdutos";

// Memoized ProdutoCard para evitar re-renders desnecessários
import { memo } from "react";
const MemoizedProdutoCard = memo(ProdutoCard);
