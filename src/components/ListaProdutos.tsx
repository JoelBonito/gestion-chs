import { useState, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/utils/activityLogger";
import { Produto } from "@/types/database";
import { ProdutosTable } from "@/components/ProdutosTable";

export interface ListaProdutosRef {
  fetchProdutos: () => void;
}

type Props = {
  searchTerm?: string;
  sort?: "nameAsc" | "nameDesc";
  limit?: number;
  allowedSupplierIds?: string[] | null;
  categoryFilter?: string[];
  fornecedorFilter?: string[];
};

export const ListaProdutos = forwardRef<ListaProdutosRef, Props>(
  ({ searchTerm = "", sort = "nameAsc", limit = 1000, allowedSupplierIds = null, categoryFilter = [], fornecedorFilter = [] }, ref) => {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProdutos = useCallback(async () => {
      try {
        setLoading(true);
        let q = supabase
          .from("produtos")
          .select("*, fornecedores(id, nome)")
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
    }, [limit, allowedSupplierIds]);

    useImperativeHandle(ref, () => ({
      fetchProdutos,
    }));

    useEffect(() => {
      fetchProdutos();
    }, [fetchProdutos]);

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

    // Filtro e ordenacao
    const sortedAndFiltered = useMemo(() => {
      const baseProdutos = produtos;

      return baseProdutos
        .filter((p) => {
          // Filtro por texto
          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const matchesSearch =
              (p.nome ?? "").toLowerCase().includes(q) ||
              (p.marca ?? "").toLowerCase().includes(q) ||
              (p.tipo ?? "").toLowerCase().includes(q);
            if (!matchesSearch) return false;
          }

          // Filtro por categoria (tipo)
          if (categoryFilter.length > 0) {
            if (!p.tipo || !categoryFilter.includes(p.tipo)) return false;
          }

          // Filtro por fornecedor
          if (fornecedorFilter.length > 0) {
            if (!p.fornecedor_id || !fornecedorFilter.includes(p.fornecedor_id)) return false;
          }

          return true;
        })
        .sort((a, b) => {
          const nomeA = (a.nome ?? "").toLowerCase();
          const nomeB = (b.nome ?? "").toLowerCase();

          if (nomeA < nomeB) return sort === "nameAsc" ? -1 : 1;
          if (nomeA > nomeB) return sort === "nameAsc" ? 1 : -1;
          return 0;
        });
    }, [produtos, searchTerm, sort, categoryFilter, fornecedorFilter]);

    return (
      <div className="w-full">
        <ProdutosTable
          produtos={sortedAndFiltered}
          loading={loading}
          onUpdate={fetchProdutos}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>
    );
  }
);

ListaProdutos.displayName = "ListaProdutos";
