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
            .eq("encomenda_id", id),
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
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

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
    return <div className="text-muted-foreground py-6 text-center">{t.loading}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Botão de Download PDF */}
      <div className="flex justify-end">
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadPDF}
            className="dark:bg-primary mb-4 border-0 bg-primary text-primary-foreground hover:bg-primary/90"
            variant="default"
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
          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
            {t.createdOn}{" "}
            <span className="font-medium text-foreground">
              {encomenda.data_criacao ? formatDate(encomenda.data_criacao) : "—"}
            </span>
          </div>
          {encomenda.etiqueta ? (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md border border-transparent bg-blue-50 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-blue-700 uppercase shadow hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40">
                {encomenda.etiqueta}
              </span>
            </div>
          ) : null}
        </section>

        {/* Meta */}
        <section className="bg-popover space-y-4 rounded-xl p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-accent border-border/40 rounded-md border p-3">
              <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                {t.client}
              </div>
              <div className="font-semibold text-foreground">
                {encomenda.clientes?.nome ?? "—"}
              </div>
            </div>
            <div className="bg-accent border-border/40 rounded-md border p-3">
              <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                {t.supplier}
              </div>
              <div className="font-semibold text-foreground">
                {encomenda.fornecedores?.nome ?? "—"}
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-accent border-border/40 rounded-md border p-3">
              <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                {t.productionDate}
              </div>
              <div className="font-semibold text-foreground">
                {encomenda.data_producao_estimada
                  ? formatDate(encomenda.data_producao_estimada)
                  : "—"}
              </div>
            </div>
            <div className="bg-accent border-border/40 rounded-md border p-3">
              <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                {t.deliveryDate}
              </div>
              <div className="font-semibold text-foreground">
                {encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : "—"}
              </div>
            </div>
          </div>

          {/* Totais - para Rosa esconder subtotal, valor pago e lucro estimado */}
          {(!isRosa || isHam) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="bg-accent border-border/40 rounded-md border p-3">
                <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  {isFelipe ? t.totalCost : t.subtotalItems}
                </div>
                <div className="font-semibold text-foreground">
                  {formatCurrencyEUR(isFelipe ? subtotalCusto : subtotalVenda)}
                </div>
              </div>

              {/* Pago — NÃO mostrar para Felipe */}
              {!isFelipe && (
                <div className="bg-accent border-border/40 rounded-md border p-3">
                  <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    {t.paid}
                  </div>
                  <div className="font-semibold text-foreground">
                    {formatCurrencyEUR(encomenda.valor_pago ?? 0)}
                  </div>
                </div>
              )}

              {/* Lucro estimado — oculto para Felipe e Ham */}
              {!(isFelipe || isHam) && (
                <div className="bg-accent border-border/40 rounded-md border p-3">
                  <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    {t.estProfit}
                  </div>
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
                <div className="bg-accent border-border/40 rounded-md border p-3">
                  <div className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    % Lucro
                  </div>
                  <div
                    className={cn(
                      "font-semibold",
                      percentLucro >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    {percentLucro.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Observações - esconder para Ham e Rosa */}
        {!isHam && !isRosa && (
          <section className="bg-popover space-y-4 rounded-xl p-4">
            {/* Observações Joel */}
            <div className="mt-6">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-muted-foreground text-sm font-semibold">Observações Joel</div>
                {(email === "jbento1@gmail.com" || email === "admin@admin.com") && !editingJoel && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setEditingJoel(true)}
                    className="text-info h-auto p-0 text-xs hover:no-underline"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                )}
              </div>
              {editingJoel ? (
                <div className="space-y-2">
                  <textarea
                    className="border-border/40 bg-accent focus:ring-primary/20 w-full rounded-md border p-2 text-sm transition-colors outline-none focus:ring-2"
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
                          setEncomenda((prev) =>
                            prev ? { ...prev, observacoes_joel: joelValue } : prev
                          );
                          setEditingJoel(false);
                        } else {
                          toast.error("Erro ao salvar observações");
                        }
                      }}
                      size="sm"
                      variant="gradient"
                      className="h-8"
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Salvar
                    </Button>
                    <Button
                      variant="cancel"
                      size="sm"
                      onClick={() => {
                        setJoelValue(encomenda?.observacoes_joel ?? "");
                        setEditingJoel(false);
                      }}
                      className="bg-accent hover:bg-accent/80 text-foreground h-8 border-none"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-accent border-border/40 rounded-md border p-3 whitespace-pre-wrap">
                  {encomenda.observacoes_joel || "—"}
                </div>
              )}
            </div>

            {/* Observações Felipe */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-muted-foreground text-sm font-semibold">
                  Observações Felipe
                </div>
                {isFelipe && !editingFelipe && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setEditingFelipe(true)}
                    className="text-info h-auto p-0 text-xs hover:no-underline"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                )}
              </div>
              {editingFelipe ? (
                <div className="space-y-2">
                  <textarea
                    className="border-border/40 bg-accent focus:ring-primary/20 w-full rounded-md border p-2 text-sm transition-colors outline-none focus:ring-2"
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
                          setEncomenda((prev) =>
                            prev ? { ...prev, observacoes_felipe: felipeValue } : prev
                          );
                          setEditingFelipe(false);
                        } else {
                          toast.error("Erro ao salvar observações");
                        }
                      }}
                      size="sm"
                      variant="gradient"
                      className="h-8"
                    >
                      <Save className="mr-1 h-3 w-3" />
                      Salvar
                    </Button>
                    <Button
                      variant="cancel"
                      size="sm"
                      onClick={() => {
                        setFelipeValue(encomenda?.observacoes_felipe ?? "");
                        setEditingFelipe(false);
                      }}
                      className="bg-accent hover:bg-accent/80 text-foreground h-8 border-none"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-accent border-border/40 rounded-md border p-3 whitespace-pre-wrap">
                  {encomenda.observacoes_felipe || "—"}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Itens */}
        <section className="bg-popover border-border/50 rounded-xl border p-5">
          <h3 className="mb-3 text-base font-semibold">{t.items}</h3>

          {loadingItens ? (
            <div className="text-muted-foreground py-6 text-center">{t.loadingItems}</div>
          ) : itens.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">{t.noItems}</div>
          ) : (
            <div className="border-border/30 overflow-x-auto rounded-lg border">
              <table className="bg-accent w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-accent text-muted-foreground border-border border-b dark:border-white/10">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase">
                      {t.product}
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                      {t.qty}
                    </th>
                    {/* Preço de venda visível para todos, exceto Felipe e usuários com hidePrices (exceto Ham) */}
                    {!isFelipe && (!hidePrices || isHam) && (
                      <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                        {t.unitPrice}
                      </th>
                    )}
                    {/* CUSTO: esconder para Ham e Rosa; mostrar para Felipe e para usuários normais sem hidePrices */}
                    {!isHam && !hidePrices && (
                      <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                        {t.unitCost}
                      </th>
                    )}
                    {(!hidePrices || isHam) && (
                      <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
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
                      <tr
                        key={item.id}
                        className="border-border bg-accent hover:bg-accent/80 border-b transition-colors dark:border-white/10"
                      >
                        <td className="px-4 py-3 font-medium uppercase">
                          {item.produtos?.nome ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{q}</td>
                        {/* Preço de venda */}
                        {!isFelipe && (!hidePrices || isHam) && (
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatCurrencyEUR(pu)}
                          </td>
                        )}
                        {/* Custo */}
                        {!isHam && !hidePrices && (
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatCurrencyEUR(pc)}
                          </td>
                        )}
                        {/* Total */}
                        {(!hidePrices || isHam) && (
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {formatCurrencyEUR(isFelipe ? totalCusto : totalVenda)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer de totais */}
                {(!hidePrices || isHam) && (
                  <tfoot>
                    <tr className="bg-accent border-border border-t-2 dark:border-white/10">
                      <td
                        className="text-foreground px-4 py-4 font-bold"
                        colSpan={isFelipe || (hidePrices && !isHam) ? 1 : 2}
                      >
                        {isFelipe ? t.totalCostFooter : t.subtotalFooter}
                      </td>
                      {!isFelipe && (!hidePrices || isHam) && <td className="px-4 py-4"></td>}
                      {!isHam && !hidePrices && <td className="px-4 py-4"></td>}
                      <td className="text-foreground px-4 py-4 text-right text-base font-black tabular-nums">
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
