import { useRef, useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, RefreshCwIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { ListaProdutos, ListaProdutosRef } from "@/components/ListaProdutos";
// ⬇️ removi useNavigate (não vamos navegar)
import { supabase } from "@/integrations/supabase/client";

// ⬇️ imports para o modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const allowedSupplierIds = useMemo(
    () => (isFelipe ? [
      "f0920a27-752c-4483-ba02-e7f32beceef6",
      "b8f995d2-47dc-4c8f-9779-ce21431f5244",
    ] : null),
    [isFelipe]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Produtos</h1>

        {/* Mantive sua regra de visibilidade do botão */}
        {email !== "barrocacolaborador.com" && (
          <Button type="button" onClick={handleCadastrarProduto}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Cadastrar produto
          </Button>
        )}
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col md:flex-row items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, marca ou tipo"
          className="w-full md:w-1/3"
        />

        <Button
          variant="outline"
          onClick={() => setSort((prev) => (prev === "nameAsc" ? "nameDesc" : "nameAsc"))}
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

        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
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
