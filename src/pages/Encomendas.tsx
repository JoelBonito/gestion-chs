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
};

type ItemEncomenda = {
  id: string;
  quantidade: number | null;
  preco_unitario: number | null;
  preco_custo: number | null;
  produtos?: { nome?: string | null } | null;
};

type Props = {
  encomendaId: string | { id?: string | number } | null | undefined;
};

export function EncomendaView({ encomendaId }: Props) {
  const { formatCurrency, formatDate } = useFormatters();

  // Normaliza id (evita eq.[object Object])
  const id = useMemo(() => {
    if (!encomendaId) return "";
    if (typeof encomendaId === "string") return encomendaId;
    if (typeof encomendaId === "object" && encomendaId.id != null) return String(encomendaId.id);
    return "";
  }, [encomendaId]);

  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItens, setLoadingItens] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";
  const isHam = email === "ham@admin.com";

  // Dicionário (FR para Ham, PT para demais)
  const t = isHam
    ? {
        order: "Commande",
        label: "Étiquette",
        status: "Statut",
        createdOn: "Créée le",
        client: "Client",
        supplier: "Fournisseur",
        productionDate: "Date de production (estimée)",
        deliveryDate: "Date de livraison (estimée)",
        subtotalItems: "Sous-total (articles)",
        totalCost: "Total (coût)",
        paid: "Montant payé",
        estProfit: "Bénéfice estimé",
        notes: "Observations",
        items: "Articles de la commande",
        product: "Produit",
        qty: "Qté",
        unitPrice: "Prix unitaire",
        unitCost: "Coût unitaire",
        total: "Total",
        totalCostFooter: "Total (coût)",
        subtotalFooter: "Sous-total",
        loading: "Chargement…",
        notFound: "Commande introuvable",
        loadingItems: "Chargement des articles…",
        noItems: "Aucun article ajouté",
      }
    : {
        order: "Pedido",
        label: "Etiqueta",
        status: "Status",
        createdOn: "Criada em",
        client: "Cliente",
        supplier: "Fornecedor",
        productionDate: "Data Produção (estimada)",
        deliveryDate: "Data Entrega (estimada)",
        subtotalItems: "Subtotal (itens)",
        totalCost: "Total (custo)",
        paid: "Valor Pago",
        estProfit: "Lucro estimado",
        notes: "Observações",
        items: "Itens da encomenda",
        product: "Produto",
        qty: "Qtd",
        unitPrice: "Preço Unit.",
        unitCost: "Custo Unit.",
        total: "Total",
        totalCostFooter: "Total (custo)",
        subtotalFooter: "Subtotal",
        loading: "Carregando…",
        notFound: "Encomenda não encontrada",
        loadingItems: "Carregando itens…",
        noItems: "Nenhum item adicionado",
      };

  // Carrega encomenda + itens
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
          .select(`*, clientes(nome), fornecedores(nome)`)
          .eq("id", id)
          .single();
        if (error) throw error;
        if (mounted) setEncomenda(data as Encomenda);
      } catch (e) {
        console.error("Erro ao carregar encomenda:", e);
        toast.error(isHam ? "Commande introuvable" : "Encomenda não encontrada");
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
            produtos(nome)
          `)
          .eq("encomenda_id", id)
          .order("id", { ascending: true });
        if (error) throw error;
        if (mounted) setItens((data as ItemEncomenda[]) || []);
      } catch (e) {
        console.error("Erro ao carregar itens da encomenda:", e);
        toast.error(isHam ? "Impossible de charger les articles" : "Não foi possível carregar os itens");
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
  }, [id, isHam]);

  const subtotalVenda = useMemo(
    () => itens.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.preco_unitario || 0), 0),
    [itens]
  );
  const subtotalCusto = useMemo(
    () => itens.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.preco_custo || 0), 0),
    [itens]
  );

  if (loading) return <div className="py-8 text-center text-muted-foreground">{t.loading}</div>;
  if (!encomenda) return <div className="py-8 text-center text-muted-foreground">{t.notFound}</div>;

  return (
    <div className="space-y-8">
      {/* Resumo */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t.order}</div>
            <div className="font-semibold">#{encomenda.numero_encomenda}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t.status}</div>
            <div className="font-semibold">{encomenda.status}</div>
          </div>
          {encomenda.etiqueta ? (
            <div className="sm:col-span-2">
              <div className="text-sm text-muted-foreground">{t.label}</div>
              <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {encomenda.etiqueta}
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-sm text-muted-foreground">{t.createdOn}</div>
            <div className="font-semibold">{encomenda.data_criacao ? formatDate(encomenda.data_criacao) : "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t.client}</div>
            <div className="font-semibold">{encomenda.clientes?.nome ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t.supplier}</div>
            <div className="font-semibold">{encomenda.fornecedores?.nome ?? "—"}</div>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t.productionDate}</div>
            <div className="font-semibold">
              {encomenda.data_producao_estimada ? formatDate(encomenda.data_producao_estimada) : "—"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t.deliveryDate}</div>
            <div className="font-semibold">
              {encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : "—"}
            </div>
          </div>
        </div>

        {/* Totais (sem lucro para Felipe e Ham) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">
              {isFelipe ? t.totalCost : t.subtotalItems}
            </div>
            <div className="font-semibold">
              {formatCurrency(isFelipe ? subtotalCusto : subtotalVenda)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t.paid}</div>
            <div className="font-semibold">{formatCurrency(encomenda.valor_pago ?? 0)}</div>
          </div>
          {/* Lucro estimado — oculto para Felipe e Ham */}
          {!(isFelipe || isHam) && (
            <div>
              <div className="text-sm text-muted-foreground">{t.estProfit}</div>
              <div
                className={cn(
                  "font-semibold",
                  subtotalVenda - subtotalCusto >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {formatCurrency(subtotalVenda - subtotalCusto)}
              </div>
            </div>
          )}
        </div>

        {encomenda.observacoes ? (
          <div>
            <div className="text-sm text-muted-foreground mb-1">{t.notes}</div>
            <div className="rounded-md bg-muted/40 p-3 whitespace-pre-wrap">{encomenda.observacoes}</div>
          </div>
        ) : null}
      </section>

      {/* Itens */}
      <section>
        <h3 className="text-base font-semibold mb-3">{t.items}</h3>

        {loadingItens ? (
          <div className="py-6 text-center text-muted-foreground">{t.loadingItems}</div>
        ) : itens.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">{t.noItems}</div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">{t.product}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.qty}</th>
                  {!isFelipe && <th className="px-3 py-2 text-right font-medium">{t.unitPrice}</th>}
                  <th className="px-3 py-2 text-right font-medium">{t.unitCost}</th>
                  <th className="px-3 py-2 text-right font-medium">{isFelipe ? t.totalCostFooter : t.total}</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it) => {
                  const q = Number(it.quantidade || 0);
                  const pu = Number(it.preco_unitario || 0);
                  const pc = Number(it.preco_custo || 0);
                  const total = isFelipe ? q * pc : q * pu;

                  return (
                    <tr key={it.id} className="border-t">
                      <td className="px-3 py-2">{it.produtos?.nome ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{q}</td>
                      {!isFelipe && <td className="px-3 py-2 text-right">{formatCurrency(pu)}</td>}
                      <td className="px-3 py-2 text-right">{formatCurrency(pc)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/30">
                  <td className="px-3 py-2 font-medium text-right" colSpan={isFelipe ? 4 : 5}>
                    {isFelipe ? t.totalCostFooter : t.subtotalFooter}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(isFelipe ? subtotalCusto : subtotalVenda)}
                  </td>
                </tr>
                {/* Para usuários normais, mostramos também o custo total; para Felipe, já mostramos total (custo) acima; para Ham, mantemos padrão sem esconder nada além do lucro */}
                {!isFelipe && (
                  <tr className="border-t">
                    <td className="px-3 py-2 text-right" colSpan={isFelipe ? 4 : 5}>
                      {t.totalCostFooter}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(subtotalCusto)}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default EncomendaView;
