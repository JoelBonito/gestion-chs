import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export default function ProdutoCard({ produto }) {

  return (
    <div className="border rounded p-3">
      <h3 className="font-semibold">{produto.nome}</h3>
      <p className="text-sm text-muted-foreground">{produto.marca}</p>
      <div className="mt-2 font-bold">{formatCurrencyEUR(produto.preco_venda)}</div>
    </div>
  );
}
