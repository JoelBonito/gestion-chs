import EncomendaView from "@/components/EncomendaView";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function PrintEncomenda() {
  const [searchParams] = useSearchParams();
  const encomendaId = searchParams.get("id");

  useEffect(() => {
    if (encomendaId) {
      // Aguarda o componente carregar completamente antes de imprimir
      setTimeout(() => {
        window.print();
      }, 1500);
    }
  }, [encomendaId]);

  if (!encomendaId) {
    return (
      <div className="p-8">
        <h1>Erro: ID da encomenda não encontrado</h1>
        <p>Não foi possível carregar a encomenda para impressão.</p>
      </div>
    );
  }

  return (
    <div className="p-8 print:p-0 print:m-0">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @page {
          margin: 1cm;
          size: A4;
        }
      `}</style>
      <EncomendaView encomendaId={encomendaId} />
    </div>
  );
}