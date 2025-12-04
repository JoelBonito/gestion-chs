import { useRef, useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, RefreshCwIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { ListaProdutos, ListaProdutosRef } from "@/components/ListaProdutos";
// ⬇️ removi useNavigate (não vamos navegar)
import { supabase } from "@/integrations/supabase/client";

// ⬇️ imports para o modal
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// ⬇️ usamos o formulário diretamente no modal
import { ProdutoForm } from "@/components/ProdutoForm";

export default function Produtos() {
  const [email, setEmail] = useState<string | null>(null);

  const listaProdutosRef = useRef<ListaProdutosRef>(null);

  // 🔍 Busca
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 150);

  // ↕️ Ordenação
  const [sort, setSort] = useState<"nameAsc" | "nameDesc">("nameAsc");

  // ⬇️ controla a abertura do modal "Novo produto"
  const [abrirNovo, setAbrirNovo] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    };

    fetchUser();
  }, []);

  const handleRefresh = () => {
    listaProdutosRef.current?.fetchProdutos?.();
  };

  // ⬇️ agora só abre o modal
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

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Produtos</h1>

        {/* Mantive sua regra de visibilidade do botão */}
        {email !== "felipe@colaborador.com" && email !== "rosa@colaborador.com" && (
          <Button type="button" onClick={handleCadastrarProduto} className="w-full sm:w-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Cadastrar produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, marca ou tipo"
          className="w-full"
        />

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setSort((prev) => (prev === "nameAsc" ? "nameDesc" : "nameAsc"))}
            className="flex-1 sm:flex-none"
          >
            {sort === "nameAsc" ? (
              <>
                <SortAscIcon className="w-4 h-4 mr-2" />
                A–Z
              </>
            ) : (
              <>
                <SortDescIcon className="w-4 h-4 mr-2" />
                Z–A
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleRefresh} className="flex-1 sm:flex-none">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Lista */}
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
            <DialogTitle>Novo produto</DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para cadastro de novo produto
            </DialogDescription>
          </DialogHeader>

          <ProdutoForm
            isEditing={false}
            onSuccess={() => {
              setAbrirNovo(false);
              // Após cadastrar, recarrega a lista
              listaProdutosRef.current?.fetchProdutos?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
