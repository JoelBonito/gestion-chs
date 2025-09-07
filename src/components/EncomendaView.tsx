// src/components/EncomendaView.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";
import { cn } from "@/lib/utils";

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

type ItemEncomenda = {
  id: string;
  quantidade: number | null;
  preco_unitario: number | null;
  preco_custo: number | null;
  produtos?: {
    nome?: string | null;
    size_weight?: number | null;
  } | null;
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

  const [loadingItens, setLoadingItens] = useState(true);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadEncomenda() {
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
        if (mounted) setEncomenda(data as Encomenda);
      } catch (e) {
        console.error("Erro ao carregar encomenda:", e);
        toast.error("Encomenda não encontrada");
        if (mounted) setEncomenda(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function loadItens() {
      if (!id) {
        setItens([]);
        setLoadingItens(false);
        return;
      }
      setLoadingItens(true);
      try {
        const { data, error } = await supabase
          .from("itens_encomenda")
          .select(`
            id,
            quantidade,
            preco_unitario,
            preco_custo,
            produtos(
              nome,
              size_weight
            )
          `)
          .eq("encomenda_id", id)
          .order("id", { ascending: true });

        if (error) throw error;
        if (mounted) setItens((data as ItemEncomenda[]) || []);
      } catch (e) {
        console.error("Erro ao carregar itens da encomenda:", e);
        toast.error("Não foi possível carregar os itens");
        if (mounted) setItens([]);
      } finally {
        if (mounted) setLoadingItens(false);
      }
    }

    loadEncomenda();
    loadItens();
    return () => {
      mounted = false;
    };
  }, [id]);

  const subtotal = useMemo(() => {
    return itens.reduce((acc, it) => {
      const q = Number(it.quantidade || 0);
      const pu = Number(it.preco_unitario || 0);
      return acc + q * pu;
    }, 0);
  }, [itens]);

  const custoTotal = useMemo(() => {
    return itens.reduce((acc, it) => {
      const q = Number(it.quantidade || 0);
      const pc = Number(it.preco_custo || 0);
      return acc + q * pc;
    }, 0);
  }, [itens]);

  const lucroEstimado = useMemo(() => subtotal - custoTotal, [subtotal, custoTotal]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Carregando…</div>;
  }

  if (!encomenda) {
    return <div className="py-8 text-center text-muted-foreground">Encomenda não encontrada</div>;
  }

  return (
    <div className="space-y-8">
      {/* Resumo principal */}
      <section className="space-y-6">
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
            <div className="sm:col-span-2">
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

        {/* Totais financeiros (com fallback aos valores da encomenda) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Subtotal (itens)</div>
            <div className="font-semibold">{formatCurrency(subtotal)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Valor Pago</div>
            <div className="font-semibold">{formatCurrency(encomenda.valor_pago ?? 0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Lucro estimado</div>
            <div
              className={cn(
                "font-semibold",
                lucroEstimado >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {formatCurrency(lucroEstimado)}
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
      </section>

      {/* Itens da encomenda */}
      <section>
        <h3 className="text-base font-semibold mb-3">Itens da encomenda</h3>

        {loadingItens ? (
          <div className="py-6 text-center text-muted-foreground">Carregando itens…</div>
        ) : itens.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">Nenhum item adicionado</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Produto</th>
                  <th className="px-3 py-2 text-right font-medium">Qtd</th>
                  <th className="px-3 py-2 text-right font-medium">Preço Unit.</th>
                  <th className="px-3 py-2 text-right font-medium">Custo Unit.</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it) => {
                  const q = Number(it.quantidade || 0);
                  const pu = Number(it.preco_unitario || 0);
                  const pc = Number(it.preco_custo || 0);
                  const total = q * pu;

                  return (
                    <tr key={it.id} className="border-t">
                      <td className="px-3 py-2">
                        {it.produtos?.nome ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{q}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(pu)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(pc)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td className="px-3 py-2 font-medium text-right" colSpan={4}>
                    Subtotal
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-right" colSpan={4}>
                    Custo total
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(custoTotal)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 text-right" colSpan={4}>
                    Lucro estimado
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-semibold",
                      lucroEstimado >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {formatCurrency(lucroEstimado)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default EncomendaView;
