// src/components/EncomendaView.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Edit2, Save, X, Package, FileText } from "lucide-react";
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

  const getStatusLabel = (status: string): string => {
    if (!isHam) return status;
    switch (status) {
      case "NOVO PEDIDO": return "Nouvelle demande";
      case "MATÉRIA PRIMA": return "Matières premières";
      case "PRODUÇÃO": return "Production";
      case "EMBALAGENS": return "Emballage";
      case "TRANSPORTE": return "Transport";
      case "ENTREGUE": return "Livré";
      default: return status;
    }
  };

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
      {/* Botão de Download PDF - Header Actions */}
      <div className="flex justify-end mb-2">
        <Button
          onClick={handleDownloadPDF}
          className="bg-[#457b77] hover:bg-[#457b77]/90 dark:bg-primary text-white border-0 shadow-sm transition-all hover:scale-105 active:scale-95"
          variant="gradient"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      <div ref={contentRef} className="space-y-6">

        {/* Header Section */}
        <section className="bg-card border border-border/40 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black font-mono tracking-tight text-primary">#{encomenda.numero_encomenda}</h1>
              {encomenda.etiqueta && (
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                  {encomenda.etiqueta}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{t.createdOn}</span>
              <span className="font-semibold text-foreground">{encomenda.data_criacao ? formatDate(encomenda.data_criacao) : "—"}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-muted px-3 py-1.5 rounded-lg border border-border/50">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider mr-2">{t.status}:</span>
              <span className="text-sm font-bold text-foreground">{isHam ? getStatusLabel(encomenda.status) : encomenda.status}</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column (Items & Notes) - 8 cols */}
          <div className="lg:col-span-8 space-y-6">

            {/* Items Section */}
            <section className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-base">{t.items}</h3>
                </div>
                <span className="bg-background text-xs font-bold px-2 py-1 rounded-md border border-border/50 shadow-sm text-muted-foreground">
                  {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {loadingItens ? (
                <div className="p-12 flex justify-center items-center text-muted-foreground gap-2">
                  <span className="animate-spin text-primary">⏳</span> {t.loadingItems}
                </div>
              ) : itens.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border-dashed">
                  <Package className="h-10 w-10 opacity-20 mb-2" />
                  <span>{t.noItems}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/10 text-left">
                        <th className="px-6 py-3 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">{t.product}</th>
                        <th className="px-6 py-3 text-right font-semibold uppercase text-[10px] tracking-wider text-muted-foreground w-20">{t.qty}</th>
                        {!isFelipe && !hidePrices && <th className="px-6 py-3 text-right font-semibold uppercase text-[10px] tracking-wider text-muted-foreground w-32">{t.unitPrice}</th>}
                        {!isHam && !hidePrices && <th className="px-6 py-3 text-right font-semibold uppercase text-[10px] tracking-wider text-muted-foreground w-32">{t.unitCost}</th>}
                        {!hidePrices && <th className="px-6 py-3 text-right font-semibold uppercase text-[10px] tracking-wider text-muted-foreground w-36 bg-muted/20">{isFelipe ? t.totalCostFooter : t.total}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {itens.map((item) => {
                        const q = Number(item.quantidade ?? 0) || 0;
                        const pu = Number(item.preco_unitario ?? 0) || 0;
                        const pc = Number(item.preco_custo ?? 0) || 0;
                        const totalVenda = q * pu;
                        const totalCusto = q * pc;
                        return (
                          <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-foreground">{item.produtos?.nome ?? "—"}</td>
                            <td className="px-6 py-3.5 text-right tabular-nums text-muted-foreground">{q}</td>
                            {!isFelipe && !hidePrices && <td className="px-6 py-3.5 text-right tabular-nums text-muted-foreground">{formatCurrencyEUR(pu)}</td>}
                            {!isHam && !hidePrices && <td className="px-6 py-3.5 text-right tabular-nums text-muted-foreground">{formatCurrencyEUR(pc)}</td>}
                            {!hidePrices && (
                              <td className="px-6 py-3.5 text-right font-bold tabular-nums bg-muted/5 group-hover:bg-muted/10">
                                {formatCurrencyEUR(isFelipe ? totalCusto : totalVenda)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    {!hidePrices && (
                      <tfoot>
                        <tr className="bg-muted/20 border-t border-border/40">
                          <td colSpan={isFelipe || hidePrices ? 2 : (isHam ? 3 : 4)} className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">
                            {isFelipe ? t.totalCostFooter : t.subtotalFooter}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-lg bg-muted/40 text-foreground">
                            {formatCurrencyEUR(isFelipe ? subtotalCusto : subtotalVenda)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </section>

            {/* Notes Section - Conditional */}
            {!isHam && !isRosa && (
              <section className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-orange-200/50 dark:border-orange-900/30 pb-2">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-base font-bold text-orange-900 dark:text-orange-200">{t.notes}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Joel Notes */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Observações Gerais</span>
                      {(email === "jbento1@gmail.com" || email === "admin@admin.com") && !editingJoel && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingJoel(true)} className="h-6 w-6 p-0 hover:bg-orange-200/50 rounded-full">
                          <Edit2 className="h-3 w-3 text-orange-700 dark:text-orange-300" />
                        </Button>
                      )}
                    </div>

                    {editingJoel ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-md border border-orange-200 dark:border-orange-800 p-2 text-sm bg-background/50 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[100px]"
                          value={joelValue}
                          onChange={(e) => setJoelValue(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setJoelValue(encomenda?.observacoes_joel ?? ""); setEditingJoel(false); }} className="h-7 text-xs">Cancelar</Button>
                          <Button onClick={async () => {
                            const { error } = await supabase.from("encomendas").update({ observacoes_joel: joelValue }).eq("id", id);
                            if (!error) { toast.success("Salvo"); setEncomenda(prev => prev ? { ...prev, observacoes_joel: joelValue } : prev); setEditingJoel(false); }
                            else { toast.error("Erro"); }
                          }} size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white border-0">Salvar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm p-3 rounded-lg bg-orange-100/50 dark:bg-orange-950/40 border border-orange-200/30 dark:border-orange-900/20 min-h-[60px] text-foreground/80 whitespace-pre-wrap">
                        {encomenda.observacoes_joel || <span className="text-muted-foreground/50 italic text-xs">Sem observações.</span>}
                      </div>
                    )}
                  </div>

                  {/* Felipe Notes */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wide">Produção</span>
                      {isFelipe && !editingFelipe && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingFelipe(true)} className="h-6 w-6 p-0 hover:bg-orange-200/50 rounded-full">
                          <Edit2 className="h-3 w-3 text-orange-700 dark:text-orange-300" />
                        </Button>
                      )}
                    </div>

                    {editingFelipe ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-md border border-orange-200 dark:border-orange-800 p-2 text-sm bg-background/50 focus:bg-background transition-all outline-none focus:ring-2 focus:ring-orange-500/20 min-h-[100px]"
                          value={felipeValue}
                          onChange={(e) => setFelipeValue(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setFelipeValue(encomenda?.observacoes_felipe ?? ""); setEditingFelipe(false); }} className="h-7 text-xs">Cancelar</Button>
                          <Button onClick={async () => {
                            const { error } = await supabase.from("encomendas").update({ observacoes_felipe: felipeValue }).eq("id", id);
                            if (!error) { toast.success("Salvo"); setEncomenda(prev => prev ? { ...prev, observacoes_felipe: felipeValue } : prev); setEditingFelipe(false); }
                            else { toast.error("Erro"); }
                          }} size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white border-0">Salvar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm p-3 rounded-lg bg-orange-100/50 dark:bg-orange-950/40 border border-orange-200/30 dark:border-orange-900/20 min-h-[60px] text-foreground/80 whitespace-pre-wrap">
                        {encomenda.observacoes_felipe || <span className="text-muted-foreground/50 italic text-xs">Sem observações.</span>}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column (Sidebar Information) - 4 cols */}
          <div className="lg:col-span-4 space-y-6">

            {/* Participants Card */}
            <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2">Participantes</h3>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{t.client}</span>
                <div className="font-semibold text-foreground text-sm leading-tight bg-muted/30 p-2 rounded-md border border-border/30">
                  {encomenda.clientes?.nome ?? "—"}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{t.supplier}</span>
                <div className="font-semibold text-foreground text-sm leading-tight bg-muted/30 p-2 rounded-md border border-border/30">
                  {encomenda.fornecedores?.nome ?? "—"}
                </div>
              </div>
            </div>

            {/* Deadlines Card */}
            <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2">Prazos e Logística</h3>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <span className="text-amber-600 dark:text-amber-400 text-xs">P</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t.productionDate}</span>
                  <span className="font-medium text-sm">{encomenda.data_producao_estimada ? formatDate(encomenda.data_producao_estimada) : "—"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <span className="text-green-600 dark:text-green-400 text-xs">E</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t.deliveryDate}</span>
                  <span className="font-medium text-sm">{encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : "—"}</span>
                </div>
              </div>
            </div>

            {/* Financial Card - Show if not Rosa and not hiding prices */}
            {!isRosa && !hidePrices && (
              <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 bg-muted/20 border-b border-border/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resumo Financeiro</h3>
                </div>
                <div className="p-5 space-y-4">

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{isFelipe ? t.totalCost : t.subtotalItems}</span>
                    <span className="font-semibold">{formatCurrencyEUR(isFelipe ? subtotalCusto : subtotalVenda)}</span>
                  </div>

                  {!isFelipe && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t.paid}</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrencyEUR(encomenda.valor_pago ?? 0)}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-border/40 my-2"></div>

                  {/* Total Profit - Admin Only */}
                  {!(isFelipe || isHam) && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Lucro Estimado</span>
                        <span className={cn("text-xl font-black", lucro >= 0 ? "text-primary" : "text-destructive")}>
                          {formatCurrencyEUR(lucro)}
                        </span>
                      </div>
                      {(email === "jbento1@gmail.com" || email === "admin@admin.com") && (
                        <div className="flex justify-end">
                          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full bg-muted/50", percentLucro >= 0 ? "text-green-600" : "text-red-500")}>
                            Margin: {percentLucro.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}