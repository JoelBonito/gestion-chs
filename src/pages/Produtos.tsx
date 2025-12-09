import { useRef, useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, RefreshCwIcon, Search } from "lucide-react";
import { ListaProdutos, ListaProdutosRef } from "@/components/ListaProdutos";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProdutoForm } from "@/components/ProdutoForm";
import { PageContainer } from "@/components/PageContainer";

export default function Produtos() {
  const [email, setEmail] = useState<string | null>(null);
  const listaProdutosRef = useRef<ListaProdutosRef>(null);

  // 🔍 Busca
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 150);

  // ↕️ Ordenação (Simplificado para tabela, mantendo estado caso precisemos passar)
  const [sort, setSort] = useState<"nameAsc" | "nameDesc">("nameAsc");

  // ⬇️ controla a abertura do modal "Novo produto"
  const [abrirNovo, setAbrirNovo] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    };
    fetchUser();
  }, []);

  const handleRefresh = () => {
    listaProdutosRef.current?.fetchProdutos?.();
  };

  const handleCadastrarProduto = () => {
    setAbrirNovo(true);
  };

  const isFelipe = (email ?? "").toLowerCase() === "felipe@colaborador.com";
  const isRosa = (email ?? "").toLowerCase() === "rosa@colaborador.com";

  const allowedSupplierIds = useMemo(
    () => (isFelipe || isRosa ? [
      "f0920a27-752c-4483-ba02-e7f32beceef6",
      "b8f995d2-47dc-4c8f-9779-ce21431f5244",
    ] : null),
    [isFelipe, isRosa]
  );

  const canCreate = email !== "felipe@colaborador.com" && email !== "rosa@colaborador.com";

  // Actions for PageHeader
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        <RefreshCwIcon className="w-4 h-4 mr-2" />
        Atualizar
      </Button>
      {canCreate && (
        <Button size="sm" onClick={handleCadastrarProduto} className="bg-primary hover:bg-primary/90">
          <PlusIcon className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer
      title="Produtos"
      subtitle="Gerencie seu catálogo de produtos"
      actions={pageActions}
    >
      {/* Filtros */}
      <div className="flex items-center gap-4 bg-white/60 dark:bg-card/40 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar produtos..."
            className="pl-9 bg-white dark:bg-background/50 border-none shadow-inner"
          />
        </div>
        {/* Aqui poderiamos ter mais filtros no futuro */}
      </div>

      {/* Lista / Tabela */}
      <ListaProdutos
        ref={listaProdutosRef}
        searchTerm={debouncedSearch}
        sort={sort}
        allowedSupplierIds={allowedSupplierIds}
      />

      {/* Modal: Novo produto */}
      <Dialog open={abrirNovo} onOpenChange={setAbrirNovo}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para cadastrar um novo item no catálogo.
            </DialogDescription>
          </DialogHeader>

          <ProdutoForm
            isEditing={false}
            onSuccess={() => {
              setAbrirNovo(false);
              listaProdutosRef.current?.fetchProdutos?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
