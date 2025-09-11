import React from "react";
import { useFormatters } from "@/hooks/useFormatters";

export default function ProdutoCard({ produto }) {
  const { formatCurrency } = useFormatters();

  return (
    <div className="border rounded p-3">
      <h3 className="font-semibold">{produto.nome}</h3>
      <p className="text-sm text-muted-foreground">{produto.marca}</p>
      <div className="mt-2 font-bold">{formatCurrency(produto.preco_venda)}</div>
    </div>
  );
}
