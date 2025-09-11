import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export default function ProdutoView({ produto }) {

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{produto.nome}</h2>
      <p>{produto.marca}</p>
      <div>
        <strong>Preço de Venda: </strong>
        {formatCurrencyEUR(produto.preco_venda)}
      </div>
      <div>
        <strong>Preço de Custo: </strong>
        {formatCurrencyEUR(produto.preco_custo)}
      </div>
    </div>
  );
}
