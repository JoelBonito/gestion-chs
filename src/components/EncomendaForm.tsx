import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export default function EncomendaForm({ valorTotal }) {

  return (
    <div className="p-4">
      <h3>Total</h3>
      <p>{formatCurrencyEUR(valorTotal)}</p>
    </div>
  );
}
