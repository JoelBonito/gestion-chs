// src/components/EncomendaView.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Edit2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useFormatters } from "@/hooks/useFormatters";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  observacoes_joel?: string | null;
  observacoes_felipe?: string | null;
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

export default function EncomendaView({ encomendaId }: Props) {
  const { formatDate } = useFormatters();
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);

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
  const [editingJoel, setEditingJoel] = useState(false);
  const [editingFelipe, setEditingFelipe] = useState(false);
  const [joelValue, setJoelValue] = useState("");
  const [felipeValue, setFelipeValue] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";
  const isHam = email === "ham@admin.com";
  const isRosa = email === "rosa@colaborador.com";

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
      noItems: "Aucun article",
      loadingItems: "Chargement des articles…",
    }
    : {
      order: "Encomenda",
      label: "Etiqueta",
      status: "Status",
      createdOn: "Criada em",
      client: "Cliente",
      supplier: "Fornecedor",
      productionDate: "Data de produção (estimada)",
      deliveryDate: "Data de entrega (estimada)",
      subtotalItems: "Subtotal (itens)",
      totalCost: "Total (custo)",
      paid: "Valor Pago",
      estProfit: "Lucro estimado",
      notes: "Observações",
      items: "Itens da encomenda",
      product: "Produto",
      qty: "Qtd",
      unitPrice: "Preço unit.",
      unitCost: "Custo unit.",
      total: "Total",
      totalCostFooter: "Total (custo)",
      subtotalFooter: "Subtotal",
      loading: "Carregando…",
      noItems: "Nenhum item",
      loadingItems: "Carregando itens…",
    };

  useEffect(() => {
    if (!id) return;
    fetchEncomenda();
    fetchItens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEncomenda = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("encomendas")
        .select(`*, clientes(nome), fornecedores(nome)`)
        .eq("id", id)
        .single();
      if (error) throw error;
      setEncomenda(data as Encomenda);
      setJoelValue(data.observacoes_joel ?? "");
      setFelipeValue(data.observacoes_felipe ?? "");
    } catch (e) {
      console.error(e);
      toast.error(isHam ? "Erreur lors du chargement" : "Erro ao carregar encomenda");
    } finally {
      setLoading(false);
    }
  };

  const fetchItens = async () => {
    try {
      setLoadingItens(true);
      const { data, error } = await supabase
        .from("itens_encomenda")
        .select(`id, quantidade, preco_unitario, preco_custo, produtos(nome)`)
        .eq("encomenda_id", id);
      if (error) throw error;
      setItens((data || []) as ItemEncomenda[]);
    } catch (e) {
      console.error(e);
      toast.error(isHam ? "Erreur lors du chargement des articles" : "Erro ao carregar itens");
    } finally {
      setLoadingItens(false);
    }
  };

  // Subtotais (conforme perfil)
  const subtotalVenda = (itens || []).reduce((acc, it) => {
    const q = Number(it.quantidade ?? 0) || 0;
    const pu = Number(it.preco_unitario ?? 0) || 0;
    return acc + q * pu;
  }, 0);

  const subtotalCusto = (itens || []).reduce((acc, it) => {
    const q = Number(it.quantidade ?? 0) || 0;
    const pc = Number(it.preco_custo ?? 0) || 0;
    return acc + q * pc;
  }, 0);

  // Cálculo da % de lucro
  const lucro = subtotalVenda - subtotalCusto;
  const percentLucro = subtotalVenda > 0 ? (lucro / subtotalVenda) * 100 : 0;

  const handleDownloadPDF = async () => {
    if (!contentRef.current || !encomenda) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // Definir margens de 20mm
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * usableWidth) / imgProps.width;

      // Se a imagem for muito alta, ajusta para caber na área útil
      if (pdfHeight > usableHeight) {
        const ratio = usableHeight / pdfHeight;
        pdf.addImage(imgData, "PNG", margin, margin, usableWidth * ratio, usableHeight);
      } else {
        pdf.addImage(imgData, "PNG", margin, margin, usableWidth, pdfHeight);
      }

      pdf.save(`Encomenda-${encomenda.numero_encomenda}.pdf`);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  if (loading || !encomenda) {
    return <div className="py-6 text-center text-muted-foreground">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Botão de Download PDF */}
      <div className="flex justify-end">
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadPDF}
            className="mb-4"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="space-y-6">
        {/* Cabeçalho */}
        <section className="space-y-2">
          <div className="text-xl font-semibold">
            {t.order} #{encomenda.numero_encomenda}
          </div>
          <div className="text-sm text-muted-foreground">
            {t.createdOn} {encomenda.data_criacao ? formatDate(encomenda.data_criacao) : "—"}
          </div>
          {encomenda.etiqueta ? (
            <div className="inline-block rounded bg-muted px-2 py-0.5 text-xs">{t.label}: {encomenda.etiqueta}</div>
          ) : null}
        </section>

        {/* Meta */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Totais - para Rosa esconder subtotal, valor pago e lucro estimado */}
          {!isRosa && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {isFelipe ? t.totalCost : t.subtotalItems}
                </div>
                <div className="font-semibold">
                  {formatCurrencyEUR(isFelipe ? subtotalCusto : subtotalVenda)}
                </div>
              </div>

              {/* Pago — NÃO mostrar para Felipe */}
              {!isFelipe && (
                <div>
                  <div className="text-sm text-muted-foreground">{t.paid}</div>
                  <div className="font-semibold">{formatCurrencyEUR(encomenda.valor_pago ?? 0)}</div>
                </div>
              )}

              {/* Lucro estimado — oculto para Felipe e Ham */}
              {!(isFelipe || isHam) && (
                <div>
                  <div className="text-sm text-muted-foreground">{t.estProfit}</div>
                  <div
                    className={cn(
                      "font-semibold",
                      lucro >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {formatCurrencyEUR(lucro)}
                  </div>
                </div>
              )}

              {/* % Lucro — mostrar apenas para jbento1@gmail.com e admin@admin.com */}
              {(email === "jbento1@gmail.com" || email === "admin@admin.com") && (
                <div>
                  <div className="text-sm text-muted-foreground">% Lucro</div>
                  <div className={cn("font-semibold", percentLucro >= 0 ? "text-success" : "text-destructive")}>
                    {percentLucro.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Observações - esconder para Ham e Rosa */}
        {!isHam && !isRosa && (
          <section className="space-y-4">
            {/* Observações Joel */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold text-muted-foreground">Observações Joel</div>
                {(email === "jbento1@gmail.com" || email === "admin@admin.com") && !editingJoel && (
                  <Button variant="link" size="sm" onClick={() => setEditingJoel(true)} className="text-xs text-info h-auto p-0 hover:no-underline">
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              {editingJoel ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full rounded-md border p-2 text-sm"
                    rows={3}
                    value={joelValue}
                    onChange={(e) => setJoelValue(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("encomendas")
                          .update({ observacoes_joel: joelValue })
                          .eq("id", id);
                        if (!error) {
                          toast.success("Observações Joel salvas!");
                          setEncomenda((prev) => prev ? { ...prev, observacoes_joel: joelValue } : prev);
                          setEditingJoel(false);
                        } else {
                          toast.error("Erro ao salvar observações");
                        }
                      }}
                      size="sm"
                      className="h-8"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setJoelValue(encomenda?.observacoes_joel ?? "");
                        setEditingJoel(false);
                      }}
                      className="h-8"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted/40 p-3 whitespace-pre-wrap">
                  {encomenda.observacoes_joel || "—"}
                </div>
              )}
            </div>

            {/* Observações Felipe */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold text-muted-foreground">Observações Felipe</div>
                {isFelipe && !editingFelipe && (
                  <Button variant="link" size="sm" onClick={() => setEditingFelipe(true)} className="text-xs text-info h-auto p-0 hover:no-underline">
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              {editingFelipe ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full rounded-md border p-2 text-sm"
                    rows={3}
                    value={felipeValue}
                    onChange={(e) => setFelipeValue(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        const { error } = await supabase
                          .from("encomendas")
                          .update({ observacoes_felipe: felipeValue })
                          .eq("id", id);
                        if (!error) {
                          toast.success("Observações Felipe salvas!");
                          setEncomenda((prev) => prev ? { ...prev, observacoes_felipe: felipeValue } : prev);
                          setEditingFelipe(false);
                        } else {
                          toast.error("Erro ao salvar observações");
                        }
                      }}
                      size="sm"
                      className="h-8"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFelipeValue(encomenda?.observacoes_felipe ?? "");
                        setEditingFelipe(false);
                      }}
                      className="h-8"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted/40 p-3 whitespace-pre-wrap">
                  {encomenda.observacoes_felipe || "—"}
                </div>
              )}
            </div>
          </section>
        )}

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
                    {/* Preço de venda visível para todos, exceto Felipe e Rosa */}
                    {!isFelipe && !hidePrices && <th className="px-3 py-2 text-right font-medium">{t.unitPrice}</th>}
                    {/* CUSTO: esconder para Ham e Rosa; mostrar para Felipe e para usuários normais */}
                    {!isHam && !hidePrices && <th className="px-3 py-2 text-right font-medium">{t.unitCost}</th>}
                    {!hidePrices && (
                      <th className="px-3 py-2 text-right font-medium">
                        {isFelipe ? t.totalCostFooter : t.total}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => {
                    const q = Number(item.quantidade ?? 0) || 0;
                    const pu = Number(item.preco_unitario ?? 0) || 0;
                    const pc = Number(item.preco_custo ?? 0) || 0;
                    const totalVenda = q * pu;
                    const totalCusto = q * pc;

                    return (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">{item.produtos?.nome ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{q}</td>
                        {/* Preço de venda */}
                        {!isFelipe && !hidePrices && (
                          <td className="px-3 py-2 text-right">{formatCurrencyEUR(pu)}</td>
                        )}
                        {/* Custo */}
                        {!isHam && !hidePrices && (
                          <td className="px-3 py-2 text-right">{formatCurrencyEUR(pc)}</td>
                        )}
                        {/* Total */}
                        {!hidePrices && (
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrencyEUR(isFelipe ? totalCusto : totalVenda)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer de totais */}
                {!hidePrices && (
                  <tfoot>
                    <tr className="bg-muted/50 border-t-2">
                      <td className="px-3 py-2 font-semibold" colSpan={isFelipe || hidePrices ? 1 : 2}>
                        {isFelipe ? t.totalCostFooter : t.subtotalFooter}
                      </td>
                      {!isFelipe && !hidePrices && <td></td>}
                      {!isHam && !hidePrices && <td></td>}
                      <td className="px-3 py-2 text-right font-semibold">
                        {formatCurrencyEUR(isFelipe ? subtotalCusto : subtotalVenda)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}