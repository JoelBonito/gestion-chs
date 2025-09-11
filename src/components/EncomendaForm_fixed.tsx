import React from "react";
import { useFormatters } from "@/hooks/useFormatters";

export default function EncomendaForm({ valorTotal }) {
  const { formatCurrency } = useFormatters();

  return (
    <div className="p-4">
      <h3>Total</h3>
      <p>{formatCurrency(valorTotal)}</p>
    </div>
  );
}
