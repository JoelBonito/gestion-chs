import React from "react";
import { useFormatters } from "@/hooks/useFormatters";

export default function ContasPagar({ contas }) {
  const { formatCurrency } = useFormatters();

  return (
    <div>
      {contas.map((conta) => (
        <div key={conta.id} className="flex justify-between">
          <span>{conta.descricao}</span>
          <span>{formatCurrency(conta.valor)}</span>
        </div>
      ))}
    </div>
  );
}
