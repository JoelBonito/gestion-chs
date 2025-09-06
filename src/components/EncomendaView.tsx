import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";

type Encomenda = {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  status: string;
  valor_total?: number | null;
  valor_pago?: number | null;
  data_criacao?: string | null;
  data_producao_estimada?: string | null;
  data_envio_estimada?: string | null;
  observacoes?: string | null;
  clientes?: { nome?: string | null } | null;
  fornecedores?: { nome?: string | null } | null;
  commission_amount?: number | null;
  valor_total_custo?: number | null;
};

type Props = {
  /** Aceita string (correto) ou objeto { id } por engano — e normaliza para string. */
  encomendaId: string | { id?: string | number } | null | undefined;
};

export function EncomendaView({ encomendaId }: Props) {
  const { formatCurrency, formatDate } = useFormatters();

  // Normaliza o id para string (evita id=eq.[object Object])
  const id = useMemo(() => {
    if (!encomendaId) return "";
    if (typeof encomendaId === "string") return encomendaId;
    if (typeof encomendaId === "object" && encomendaId.id != null) return String(encomendaId.id);
    return "";
  }, [encomendaId]);

  const [loading, setLoading] = useState(true);
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id) {
        setEncomenda(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("encomendas")
          .select(
            `
            *,
            clientes(nome),
            fornecedores(nome)
          `
          )
          .eq("id", id)
          .single();

        if (error) throw error;

        if (mounted) {
          // (Opcional) cálculo de commission/valor_total_custo pode ser feito aqui
          setEncomenda(data as Encomenda);
        }
      } catch (e) {
        console.error("Erro ao carregar encomenda:", e);
        toast.error("Encomenda não encontrada");
        if (mounted) setEncomenda(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Carregando…</div>;
  }

  if (!encomenda) {
    return <div className="py-8 text-center text-muted-foreground">Encomenda não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Resumo principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Pedido</div>
          <div className="font-semibold">#{encomenda.numero_e_
