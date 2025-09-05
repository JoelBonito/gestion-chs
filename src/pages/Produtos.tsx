import { useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, RefreshCwIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { ListaProdutos, ListaProdutosRef } from "@/components/ListaProdutos";
import { useRouter } from "next/router";

export default function Produtos() {
  const { session } = useSession();
  const router = useRouter();

  const listaProdutosRef = useRef<ListaProdutosRef>(null);

  // 🔍 Busca
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // ↕️ Ordenação
  const [sort, setSort] = useState<"nameAsc" | "nameDesc">("nameAsc");

  const handleRefresh = () => {
    listaProdutosRef.current?.fetchProdutos();
  };

  const handleCadastrarProduto = () => {
    router.push("/produtos/novo");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Produtos</h1>
        {session?.user.email !== "barrocacolaborador.com" && (
          <Button onClick={handleCadastrarProduto}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Cadastrar produto
          </Button>
        )}
      </div>

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

      <ListaProdutos
        ref={listaProdutosRef}
        searchTerm={debouncedSearch}
        sort={sort}
      />
    </div>
  );
}
