import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ListaProdutos from "@/components/ListaProdutos"; // ✅ default export

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<"nameAsc" | "nameDesc">("nameAsc");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button onClick={() => setRefreshTrigger((prev) => prev + 1)}>Atualizar</Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "nameAsc" | "nameDesc")}
          className="border rounded px-2"
        >
          <option value="nameAsc">Nome (A-Z)</option>
          <option value="nameDesc">Nome (Z-A)</option>
        </select>
      </div>

      <ListaProdutos searchTerm={searchTerm} sort={sort} refreshTrigger={refreshTrigger} />
    </div>
  );
}
