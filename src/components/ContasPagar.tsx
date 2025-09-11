import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export default function ContasPagar({ contas }) {

  return (
    <div>
      {contas.map((conta) => (
        <div key={conta.id} className="flex justify-between">
          <span>{conta.descricao}</span>
          <span>{formatCurrencyEUR(conta.valor)}</span>
        </div>
      ))}
    </div>
  );
}
