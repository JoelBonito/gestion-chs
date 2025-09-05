// src/components/ListaProdutos.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// ... seus imports de UI

type Props = {
  searchTerm?: string;                      // 🔎 texto de busca
  sort?: "nameAsc" | "nameDesc";           // ↕️ ordenação
};

export const ListaProdutos = forwardRef(function ListaProdutos(
  { searchTerm = "", sort = "nameAsc" }: Props,
  ref
) {
  const [produtos, setProdutos] = useState<any[]>([]);

  async function fetchProdutos() {
    // Busque somente o que precisa (ex.: nome, marca, tipo, preço, etc.)
    const { data, error } = await supabase
      .from("produtos")
      .select("id,nome,marca,tipo,preco_venda,ativo")
      .order("nome", { ascending: true }); // já vem A–Z do server

    if (error) {
      console.error(error);
      return;
    }
    setProdutos(data ?? []);
  }

  useImperativeHandle(ref, () => ({ fetchProdutos }));

  useEffect(() => {
    fetchProdutos();
  }, []);

  // 🔎 filtro client-side (nome, marca, tipo)
  const filtered = produtos.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (p.nome ?? "").toLowerCase().includes(q) ||
      (p.marca ?? "").toLowerCase().includes(q) ||
      (p.tipo ?? "").toLowerCase().includes(q)
    );
  });

  // ↕️ ordenação alfabética (garante no client caso a busca mude a ordem)
  filtered.sort((a, b) => {
    const an = (a.nome ?? "").toLowerCase();
    const bn = (b.nome ?? "").toLowerCase();
    if (an < bn) return sort === "nameAsc" ? -1 : 1;
    if (an > bn) return sort === "nameAsc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((p) => (
        // ... seu card de produto aqui
        <div key={p.id} className="rounded-xl border p-4">
          <div className="font-semibold">{p.nome}</div>
          <div className="text-sm text-muted-foreground">{p.marca} • {p.tipo}</div>
          {/* etc */}
        </div>
      ))}
    </div>
  );
});
