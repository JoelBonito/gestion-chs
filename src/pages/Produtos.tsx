import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProdutoForm, ProdutoView, ProdutoFilters, ProdutoList } from "@/components/produtos";
import { PageContainer } from "@/components/shared";
import { Option } from "@/components/ui/multi-select";
import { Produto } from "@/types/database";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import { toast } from "sonner";
import { useProdutoTranslation } from "@/hooks/useProdutoTranslation";

export default function Produtos() {
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);
  const { t, isHam } = useProdutoTranslation();
  const FORNECEDOR_PRODUCAO_ID = "b8f995d2-47dc-4c8f-9779-ce21431f5244";

  // Estados de Dados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showInactive, setShowInactive] = useState(false);

  const [categorias, setCategorias] = useState<Option[]>([]);
  const [fornecedores, setFornecedores] = useState<Option[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);

  // Modais
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  // Inicialização
  useEffect(() => {
    fetchFilters();
    fetchProdutos();
  }, []);

  const fetchFilters = async () => {
    try {
      const { data: produtosData } = await supabase
        .from("produtos")
        .select("tipo")
        .not("tipo", "is", null);

      if (produtosData) {
        const uniqueCategories = [...new Set(produtosData.map((p) => p.tipo).filter(Boolean))];
        setCategorias(uniqueCategories.map((cat) => ({ value: cat!, label: cat! })));
      }

      const { data: fornecedoresData } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("active", true)
        .order("nome");

      if (fornecedoresData) {
        setFornecedores(fornecedoresData.map((f) => ({ value: f.id, label: f.nome })));
      }
    } catch (error) {
      console.error("Erro ao carregar filtros:", error);
    }
  };

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, fornecedores(id, nome)")
        .order("nome");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditDialogOpen(false);
    fetchProdutos();
    fetchFilters();
  };

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setEditDialogOpen(true);
  };

  const handleView = (produto: Produto) => {
    setSelectedProduto(produto);
    setViewDialogOpen(true);
  };

  const filteredProdutos = useMemo(() => {
    return produtos.filter((produto) => {
      const matchesSearch =
        produto.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (produto.marca || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (produto.tipo || "").toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesCategory =
        selectedCategorias.length === 0 ||
        (produto.tipo && selectedCategorias.includes(produto.tipo));

      const matchesFornecedor =
        selectedFornecedores.length === 0 ||
        (produto.fornecedor_id && selectedFornecedores.includes(produto.fornecedor_id));

      const matchesStatus = showInactive ? true : produto.ativo;

      return matchesSearch && matchesCategory && matchesFornecedor && matchesStatus;
    });
  }, [produtos, debouncedSearch, showInactive, selectedCategorias, selectedFornecedores]);

  return (
    <OptimizedRoleGuard>
      <PageContainer
        title={t("Produtos")}
        subtitle={t("Gestão de catálogo e lista de preços")}
        actions={
          !isHam && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t("Novo Produto")}</span>
                  <span className="sm:hidden">{t("Novo Produto")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border/50 max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("Novo Produto")}</DialogTitle>
                  <DialogDescription>{t("Gestão de catálogo e lista de preços")}</DialogDescription>
                </DialogHeader>
                <ProdutoForm onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          )
        }
      >
        <ProdutoFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategorias={selectedCategorias}
          onCategoriasChange={setSelectedCategorias}
          categorias={categorias}
          selectedFornecedores={selectedFornecedores}
          onFornecedoresChange={setSelectedFornecedores}
          fornecedores={fornecedores}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
          t={t}
        />

        {/* Dialogs */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-card max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>{t("Editar Produto")}</DialogTitle>
              <DialogDescription>{t("Atualize as informações do produto")}</DialogDescription>
            </DialogHeader>
            <ProdutoForm onSuccess={handleSuccess} produto={selectedProduto} isEditing={true} />
          </DialogContent>
        </Dialog>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="bg-card max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>{t("Detalhes do Produto")}</DialogTitle>
            </DialogHeader>
            {selectedProduto && (
              <ProdutoView produto={selectedProduto} onClose={() => setViewDialogOpen(false)} />
            )}
          </DialogContent>
        </Dialog>

        <ProdutoList
          produtos={filteredProdutos}
          loading={loading}
          isHam={isHam}
          hidePrices={hidePrices}
          FORNECEDOR_PRODUCAO_ID={FORNECEDOR_PRODUCAO_ID}
          onEdit={handleEdit}
          onView={handleView}
          onRefresh={fetchProdutos}
          t={t}
        />
      </PageContainer>
    </OptimizedRoleGuard>
  );
}
