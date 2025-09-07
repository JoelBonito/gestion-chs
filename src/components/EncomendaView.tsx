// src/components/EncomendaView.tsx
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
          <div className="font-semibold">#{encomenda.numero_encomenda}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Status</div>
          <div className="font-semibold">{encomenda.status}</div>
        </div>

        {encomenda.etiqueta ? (
          <div>
            <div className="text-sm text-muted-foreground">Etiqueta</div>
            <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {encomenda.etiqueta}
            </div>
          </div>
        ) : null}

        <div>
          <div className="text-sm text-muted-foreground">Criada em</div>
          <div className="font-semibold">
            {encomenda.data_criacao ? formatDate(encomenda.data_criacao) : "—"}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Cliente</div>
          <div className="font-semibold">{encomenda.clientes?.nome ?? "—"}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Fornecedor</div>
          <div className="font-semibold">{encomenda.fornecedores?.nome ?? "—"}</div>
        </div>
      </div>

      {/* Datas estimadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Data Produção (estimada)</div>
          <div className="font-semibold">
            {encomenda.data_producao_estimada ? formatDate(encomenda.data_producao_estimada) : "—"}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Data Entrega (estimada)</div>
          <div className="font-semibold">
            {encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : "—"}
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Valor Total</div>
          <div className="font-semibold">
            {formatCurrency(encomenda.valor_total ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Valor Pago</div>
          <div className="font-semibold">
            {formatCurrency(encomenda.valor_pago ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Comissão</div>
          <div className="font-semibold">
            {formatCurrency(encomenda.commission_amount ?? 0)}
          </div>
        </div>
      </div>

      {/* Observações */}
      {encomenda.observacoes ? (
        <div>
          <div className="text-sm text-muted-foreground mb-1">Observações</div>
          <div className="rounded-md bg-muted/40 p-3 whitespace-pre-wrap">
            {encomenda.observacoes}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default EncomendaView;
