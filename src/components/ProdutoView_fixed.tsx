import React from "react";
import { useFormatters } from "@/hooks/useFormatters";

export default function ProdutoView({ produto }) {
  const { formatCurrency } = useFormatters();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{produto.nome}</h2>
      <p>{produto.marca}</p>
      <div>
        <strong>Preço de Venda: </strong>
        {formatCurrency(produto.preco_venda)}
      </div>
      <div>
        <strong>Preço de Custo: </strong>
        {formatCurrency(produto.preco_custo)}
      </div>
    </div>
  );
}
