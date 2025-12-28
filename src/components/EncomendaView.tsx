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

    const loadAllData = async () => {
      try {
        setLoading(true);
        setLoadingItens(true);

        // Dispara ambas em paralelo
        const [encomendaRes, itensRes] = await Promise.all([
          supabase
            .from("encomendas")
            .select(`*, clientes(nome), fornecedores(nome)`)
            .eq("id", id)
            .single(),
          supabase
            .from("itens_encomenda")
            .select(`id, quantidade, preco_unitario, preco_custo, produtos(nome)`)
            .eq("encomenda_id", id)
        ]);

        if (encomendaRes.error) throw encomendaRes.error;
        if (itensRes.error) throw itensRes.error;

        const dataEnc = encomendaRes.data as Encomenda;
        setEncomenda(dataEnc);
        setJoelValue(dataEnc.observacoes_joel ?? "");
        setFelipeValue(dataEnc.observacoes_felipe ?? "");

        setItens((itensRes.data || []) as ItemEncomenda[]);
      } catch (e) {
        console.error(e);
        toast.error(isHam ? "Erreur lors du chargement" : "Erro ao carregar dados da encomenda");
      } finally {
        setLoading(false);
        setLoadingItens(false);
      }
    };

    loadAllData();
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

    const toastId = toast.loading("Gerando PDF...");

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const root = clonedDoc.documentElement;
          root.classList.remove("dark");
          root.classList.add("light");

          const style = clonedDoc.createElement("style");
          style.innerHTML = `
            :root {
              --background: #f9fafb !important;
              --foreground: #111827 !important;
              --card: #f1f2f4 !important;
              --card-foreground: #111827 !important;
              --popover: #f9fafb !important;
              --popover-foreground: #111827 !important;
              --primary: #457b77 !important;
              --primary-foreground: #FFFFFF !important;
              --secondary: #f1f2f4 !important;
              --secondary-foreground: #111827 !important;
              --muted: #f1f2f4 !important;
              --muted-foreground: #6B7280 !important;
              --accent: #f1f2f4 !important;
              --accent-foreground: #111827 !important;
              --destructive: #ef4444 !important;
              --destructive-foreground: #fafafa !important;
              --border: #e5e7eb !important;
              --input: #e5e7eb !important;
              --ring: #457b77 !important;
              --radius: 0.5rem !important;
            }
            body {
              background-color: #ffffff !important;
              color: #111827 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * usableWidth) / imgProps.width;

      if (pdfHeight > usableHeight) {
        const ratio = usableHeight / pdfHeight;
        pdf.addImage(imgData, "PNG", margin, margin, usableWidth * ratio, usableHeight);
      } else {
        pdf.addImage(imgData, "PNG", margin, margin, usableWidth, pdfHeight);
      }

      pdf.save(`Encomenda-${encomenda.numero_encomenda}.pdf`);
      toast.success("PDF baixado com sucesso!", { id: toastId });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF: Cores incompatíveis", { id: toastId });
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
            className="mb-4 bg-[#457b77] hover:bg-[#457b77]/90 dark:bg-primary text-white border-0"
            variant="gradient"
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
          <div className="text-sm text-gray-500 dark:text-[#94a2b8]">
            {t.createdOn} <span className="text-gray-900 dark:text-white font-medium">{encomenda.data_criacao ? formatDate(encomenda.data_criacao) : "—"}</span>
          </div>
          {encomenda.etiqueta ? (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md border border-transparent bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 text-xs font-semibold shadow hover:bg-blue-100 dark:hover:bg-blue-900/40 uppercase tracking-wider">
                {encomenda.etiqueta}
              </span>
            </div>
          ) : null}
        </section>

        {/* Meta */}
        <section className="space-y-4 bg-popover p-4 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-accent p-3 rounded-md border border-border/40">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.client}</div>
              <div className="font-semibold text-gray-900 dark:text-white">{encomenda.clientes?.nome ?? "—"}</div>
            </div>
            <div className="bg-accent p-3 rounded-md border border-border/40">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.supplier}</div>
              <div className="font-semibold text-gray-900 dark:text-white">{encomenda.fornecedores?.nome ?? "—"}</div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-accent p-3 rounded-md border border-border/40">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.productionDate}</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {encomenda.data_producao_estimada ? formatDate(encomenda.data_producao_estimada) : "—"}
              </div>
            </div>
            <div className="bg-accent p-3 rounded-md border border-border/40">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.deliveryDate}</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : "—"}
              </div>
            </div>
          </div>

          {/* Totais - para Rosa esconder subtotal, valor pago e lucro estimado */}
          {!isRosa && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-accent p-3 rounded-md border border-border/40">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {isFelipe ? t.totalCost : t.subtotalItems}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyEUR(isFelipe ? subtotalCusto : subtotalVenda)}
                </div>
              </div>

              {/* Pago — NÃO mostrar para Felipe */}
              {!isFelipe && (
                <div className="bg-accent p-3 rounded-md border border-border/40">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.paid}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{formatCurrencyEUR(encomenda.valor_pago ?? 0)}</div>
                </div>
              )}

              {/* Lucro estimado — oculto para Felipe e Ham */}
              {!(isFelipe || isHam) && (
                <div className="bg-accent p-3 rounded-md border border-border/40">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.estProfit}</div>
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
                <div className="bg-accent p-3 rounded-md border border-border/40">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">% Lucro</div>
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
          <section className="space-y-4 bg-popover p-4 rounded-xl">
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
                    className="w-full rounded-md border border-border/40 p-2 text-sm bg-accent transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
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
                      variant="gradient"
                      className="h-8"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      variant="cancel"
                      size="sm"
                      onClick={() => {
                        setJoelValue(encomenda?.observacoes_joel ?? "");
                        setEditingJoel(false);
                      }}
                      className="h-8 bg-accent hover:bg-accent/80 border-none text-foreground"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-accent border border-border/40 p-3 whitespace-pre-wrap">
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
                    className="w-full rounded-md border border-border/40 p-2 text-sm bg-accent transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
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
                      variant="gradient"
                      className="h-8"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      variant="cancel"
                      size="sm"
                      onClick={() => {
                        setFelipeValue(encomenda?.observacoes_felipe ?? "");
                        setEditingFelipe(false);
                      }}
                      className="h-8 bg-accent hover:bg-accent/80 border-none text-foreground"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-accent border border-border/40 p-3 whitespace-pre-wrap">
                  {encomenda.observacoes_felipe || "—"}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Itens */}
        <section className="bg-popover p-5 rounded-xl border border-border/50">
          <h3 className="text-base font-semibold mb-3">{t.items}</h3>

          {loadingItens ? (
            <div className="py-6 text-center text-muted-foreground">{t.loadingItems}</div>
          ) : itens.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">{t.noItems}</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/30">
              <table className="w-full border-collapse text-sm bg-accent">
                <thead>
                  <tr className="bg-accent text-muted-foreground border-b border-border dark:border-white/10">
                    <th className="px-4 py-3 text-left font-semibold uppercase text-[10px] tracking-wider">{t.product}</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase text-[10px] tracking-wider">{t.qty}</th>
                    {/* Preço de venda visível para todos, exceto Felipe e Rosa */}
                    {!isFelipe && !hidePrices && <th className="px-4 py-3 text-right font-semibold uppercase text-[10px] tracking-wider">{t.unitPrice}</th>}
                    {/* CUSTO: esconder para Ham e Rosa; mostrar para Felipe e para usuários normais */}
                    {!isHam && !hidePrices && <th className="px-4 py-3 text-right font-semibold uppercase text-[10px] tracking-wider">{t.unitCost}</th>}
                    {!hidePrices && (
                      <th className="px-4 py-3 text-right font-semibold uppercase text-[10px] tracking-wider">
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
                      <tr key={item.id} className="border-b border-border dark:border-white/10 bg-accent hover:bg-accent/80 transition-colors">
                        <td className="px-4 py-3 uppercase font-medium">{item.produtos?.nome ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{q}</td>
                        {/* Preço de venda */}
                        {!isFelipe && !hidePrices && (
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrencyEUR(pu)}</td>
                        )}
                        {/* Custo */}
                        {!isHam && !hidePrices && (
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrencyEUR(pc)}</td>
                        )}
                        {/* Total */}
                        {!hidePrices && (
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
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
                    <tr className="bg-accent border-t-2 border-border dark:border-white/10">
                      <td className="px-4 py-4 font-bold text-foreground" colSpan={isFelipe || hidePrices ? 1 : 2}>
                        {isFelipe ? t.totalCostFooter : t.subtotalFooter}
                      </td>
                      {!isFelipe && !hidePrices && <td className="px-4 py-4"></td>}
                      {!isHam && !hidePrices && <td className="px-4 py-4"></td>}
                      <td className="px-4 py-4 text-right font-black text-base text-foreground tabular-nums">
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