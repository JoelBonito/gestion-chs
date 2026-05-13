import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { InvoiceFormData } from "@/types/invoice";
import {
  calcularResumoIva,
  calcularTotais,
} from "@/lib/fatura/calculos";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import {
  formatarNumeroCompleto,
  getProximaSequencia,
} from "@/lib/fatura/numeracao";
import {
  toJson,
  type ConversaoBRL,
  type FaturaCompleta,
  type LinhaFatura,
  type SnapshotCliente,
} from "@/lib/fatura/types";
import { getTaxaEurBrl } from "@/lib/fatura/cambio";
import { FaturaPDF } from "./FaturaPDF";
import { LinhasFaturaManager } from "./LinhasFaturaManager";
import { ClienteFiscalInlineEdit } from "./ClienteFiscalInlineEdit";

interface Cliente {
  id: string;
  nome: string;
  nome_social: string | null;
  nif: string | null;
  codigo_cliente: string | null;
  endereco: string | null;
  codigo_postal: string | null;
  cidade: string | null;
  pais: string | null;
}

export interface EmitirFaturaInitialData {
  cliente_id: string | null;
  linhas: LinhaFatura[];
  descricao_extra?: string;
  condicoes_pagamento?: string;
  moeda?: string;
}

interface EmitirFaturaPanelProps {
  onSubmitEmission: (data: InvoiceFormData) => Promise<unknown>;
  isSubmitting?: boolean;
  onSuccess?: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  initialData?: EmitirFaturaInitialData | null;
}

const NUMERO_SERIE = "INV";
const STORAGE_BUCKET = "faturas-emitidas";
const MAX_RETRY = 3;

const sectionCls = "bg-card border border-border rounded-xl p-5";
const labelCls =
  "text-xs font-semibold uppercase text-muted-foreground tracking-wide";
const inputCls =
  "bg-popover border-border/40 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 h-11";

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function parseSequenciaFromNumero(numero: string): number | null {
  const match = numero.match(/(\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const seq = parseInt(match[2], 10);
  return Number.isFinite(seq) && seq > 0 ? seq : null;
}

function buildSnapshot(cliente: Cliente): SnapshotCliente {
  return {
    nome: cliente.nome,
    nome_social: cliente.nome_social,
    nif: cliente.nif,
    codigo_cliente: cliente.codigo_cliente,
    endereco: cliente.endereco,
    codigo_postal: cliente.codigo_postal,
    cidade: cliente.cidade,
    pais: cliente.pais,
  };
}

function clienteTemDadosFiscaisIncompletos(cliente: Cliente): boolean {
  return (
    !cliente.nif?.trim() ||
    !cliente.endereco?.trim() ||
    !cliente.codigo_postal?.trim() ||
    !cliente.cidade?.trim()
  );
}

export function EmitirFaturaPanel({
  onSubmitEmission,
  isSubmitting = false,
  onSuccess,
  submitLabel = "Emitir e Salvar Fatura",
  submittingLabel = "A emitir e salvar...",
  initialData = null,
}: EmitirFaturaPanelProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>("");
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [numeroCompleto, setNumeroCompleto] = useState<string>("");
  const [sequenciaSugerida, setSequenciaSugerida] = useState<number>(0);
  const [numeroEditado, setNumeroEditado] = useState<boolean>(false);

  const [dataEmissao, setDataEmissao] = useState<string>(todayIso());
  const [dataVencimento, setDataVencimento] = useState<string>(todayIso());
  const [condicoesPagamento, setCondicoesPagamento] =
    useState<string>("Pronto Pagamento");
  const [moeda, setMoeda] = useState<string>("Euro");

  const [linhas, setLinhas] = useState<LinhaFatura[]>([]);
  const [descricaoExtra, setDescricaoExtra] = useState<string>("");
  const [emitindo, setEmitindo] = useState(false);

  useEffect(() => {
    void inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function inicializar() {
    const ano = new Date().getFullYear();
    const [clientesRes, sequencia] = await Promise.all([
      supabase
        .from("clientes")
        .select(
          "id, nome, nome_social, nif, codigo_cliente, endereco, codigo_postal, cidade, pais"
        )
        .eq("active", true)
        .order("nome"),
      getProximaSequencia(ano, NUMERO_SERIE).catch(() => 1),
    ]);

    const clientesList = (clientesRes.data ?? []) as Cliente[];
    if (clientesRes.data) setClientes(clientesList);
    setSequenciaSugerida(sequencia);
    setNumeroCompleto(formatarNumeroCompleto(NUMERO_SERIE, ano, sequencia));
    setNumeroEditado(false);
    setDataEmissao(todayIso());
    setDataVencimento(todayIso());
    setCondicoesPagamento(initialData?.condicoes_pagamento ?? "Pronto Pagamento");
    setMoeda(initialData?.moeda ?? "Euro");
    setLinhas(
      initialData?.linhas?.map((l) => ({ ...l, uid: crypto.randomUUID() })) ?? []
    );
    setDescricaoExtra(initialData?.descricao_extra ?? "");

    if (initialData?.cliente_id) {
      const found = clientesList.find((c) => c.id === initialData.cliente_id) ?? null;
      setClienteId(initialData.cliente_id);
      setCliente(found);
      if (!found) {
        const { data } = await supabase
          .from("clientes")
          .select(
            "id, nome, nome_social, nif, codigo_cliente, endereco, codigo_postal, cidade, pais"
          )
          .eq("id", initialData.cliente_id)
          .maybeSingle();
        if (data) setCliente(data as Cliente);
      }
    } else {
      setClienteId("");
      setCliente(null);
    }
  }

  async function recarregarCliente(id: string) {
    const { data } = await supabase
      .from("clientes")
      .select(
        "id, nome, nome_social, nif, codigo_cliente, endereco, codigo_postal, cidade, pais"
      )
      .eq("id", id)
      .maybeSingle();
    if (data) {
      setCliente(data as Cliente);
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? (data as Cliente) : c))
      );
    }
  }

  function handleClienteChange(id: string) {
    setClienteId(id);
    const c = clientes.find((x) => x.id === id) ?? null;
    setCliente(c);
  }

  const totais = useMemo(() => calcularTotais(linhas), [linhas]);
  const resumoIva = useMemo(() => calcularResumoIva(linhas), [linhas]);

  const linhasValidas = linhas.filter(
    (l) => l.descricao.trim().length > 0 && l.preco > 0 && l.qtd > 0
  );
  const podeEmitir = !!cliente && linhasValidas.length > 0 && !emitindo;

  async function emitir() {
    if (!cliente || linhasValidas.length === 0) return;
    setEmitindo(true);

    const ano = new Date(dataEmissao).getFullYear();
    let sequencia = numeroEditado
      ? parseSequenciaFromNumero(numeroCompleto) ?? sequenciaSugerida
      : sequenciaSugerida;
    let numeroFinal = formatarNumeroCompleto(NUMERO_SERIE, ano, sequencia);

    const snapshot = buildSnapshot(cliente);

    try {
      let conversaoBrl: ConversaoBRL | null = null;
      try {
        const cot = await getTaxaEurBrl(dataEmissao);
        conversaoBrl = {
          taxa: cot.taxa,
          data_cotacao: cot.data_cotacao,
          fonte: cot.fonte,
          total_brl: Math.round(totais.total_pagar * cot.taxa * 100) / 100,
        };
      } catch (e) {
        toast.warning(
          `Não foi possível obter taxa BCB para ${dataEmissao}. A fatura será emitida sem conversão BRL.`
        );
      }

      let faturaEmitidaId: string | null = null;

      for (let tentativa = 0; tentativa < MAX_RETRY; tentativa++) {
        const insertRes = await supabase
          .from("faturas_emitidas")
          .insert({
            numero_serie: NUMERO_SERIE,
            ano,
            sequencia,
            numero_completo: numeroFinal,
            cliente_id: cliente.id,
            snapshot_cliente: toJson(snapshot),
            data_emissao: dataEmissao,
            data_vencimento: dataVencimento,
            condicoes_pagamento: condicoesPagamento,
            moeda,
            linhas: toJson(linhasValidas),
            totais: toJson(totais),
            resumo_iva: toJson(resumoIva),
            taxa_conversao_brl: conversaoBrl?.taxa ?? null,
            total_brl: conversaoBrl?.total_brl ?? null,
            data_cotacao_brl: conversaoBrl?.data_cotacao ?? null,
          })
          .select("id")
          .single();

        if (!insertRes.error && insertRes.data) {
          faturaEmitidaId = insertRes.data.id;
          break;
        }

        const isUnique =
          insertRes.error?.code === "23505" ||
          insertRes.error?.message?.toLowerCase().includes("unique");
        if (!isUnique) throw insertRes.error;

        sequencia = await getProximaSequencia(ano, NUMERO_SERIE);
        numeroFinal = formatarNumeroCompleto(NUMERO_SERIE, ano, sequencia);
      }

      if (!faturaEmitidaId) {
        throw new Error(
          "Não foi possível obter uma sequência única após várias tentativas."
        );
      }

      const fatura: FaturaCompleta = {
        numero_serie: NUMERO_SERIE,
        ano,
        sequencia,
        numero_completo: numeroFinal,
        cliente_id: cliente.id,
        snapshot_cliente: snapshot,
        data_emissao: dataEmissao,
        data_vencimento: dataVencimento,
        condicoes_pagamento: condicoesPagamento,
        moeda,
        linhas: linhasValidas,
        totais,
        resumo_iva: resumoIva,
        conversao_brl: conversaoBrl,
      };

      const pdfBlob = await pdf(<FaturaPDF fatura={fatura} />).toBlob();

      const fileName = `${NUMERO_SERIE}_${ano}_${sequencia}.pdf`;
      const storagePath = `${ano}/${fileName}`;

      const upload = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (upload.error) throw upload.error;

      const { error: updErr } = await supabase
        .from("faturas_emitidas")
        .update({ pdf_storage_path: storagePath })
        .eq("id", faturaEmitidaId);

      if (updErr) throw updErr;

      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      const descricaoFinal = descricaoExtra.trim() || numeroFinal;

      await onSubmitEmission({
        invoice_date: dataEmissao,
        amount: totais.total_pagar,
        description: descricaoFinal,
        file,
        fatura_emitida_id: faturaEmitidaId,
      });

      toast.success(`Fatura ${numeroFinal} emitida e salva`);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao emitir fatura: ${msg}`);
    } finally {
      setEmitindo(false);
    }
  }

  const fiscalIncompleto = cliente
    ? clienteTemDadosFiscaisIncompletos(cliente)
    : false;

  const submitting = emitindo || isSubmitting;

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-4">
          {/* Descrição (concatenada ao nº da fatura) */}
          <div className={sectionCls}>
            <Label
              htmlFor="emit_description"
              className={labelCls}
            >
              Descrição (Opcional)
            </Label>
            <Textarea
              id="emit_description"
              value={descricaoExtra}
              onChange={(e) => setDescricaoExtra(e.target.value)}
              rows={2}
              placeholder="Texto adicional para identificar a fatura..."
              className="bg-popover border-border/40 resize-none mt-2"
            />
            <p className="text-muted-foreground text-[10px] italic mt-1.5">
              Se deixar vazio, será preenchido com o nº da fatura: <span className="font-mono">{descricaoExtra.trim() || numeroCompleto || "FT YYYY/NN"}</span>
            </p>
          </div>

          {/* Cabeçalho */}
          <div className={sectionCls}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label className={labelCls}>Nº Fatura</Label>
                <Input
                  value={numeroCompleto}
                  onChange={(e) => {
                    setNumeroCompleto(e.target.value);
                    setNumeroEditado(true);
                  }}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Data Emissão</Label>
                <Input
                  type="date"
                  value={dataEmissao}
                  onChange={(e) => setDataEmissao(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Data Vencimento</Label>
                <Input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Cond. Pagamento</Label>
                <Input
                  value={condicoesPagamento}
                  onChange={(e) => setCondicoesPagamento(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Moeda</Label>
                <Input
                  value={moeda}
                  onChange={(e) => setMoeda(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-3">
              <Label className={labelCls}>Cliente</Label>
              <Select value={clienteId} onValueChange={handleClienteChange}>
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_social ?? c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dados Fiscais Cliente */}
          {cliente && (
            <div className={sectionCls}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <Label className={labelCls}>Dados Fiscais</Label>
                  <p className="text-sm font-semibold mt-1 text-foreground">
                    {cliente.nome_social ?? cliente.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NIF: {cliente.nif ?? "—"}
                    {cliente.codigo_cliente
                      ? ` · Cód.: ${cliente.codigo_cliente}`
                      : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      cliente.endereco,
                      [cliente.codigo_postal, cliente.cidade]
                        .filter(Boolean)
                        .join(" "),
                      cliente.pais,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sem morada definida"}
                  </p>
                </div>
                <ClienteFiscalInlineEdit
                  clienteId={cliente.id}
                  onSaved={() => recarregarCliente(cliente.id)}
                />
              </div>

              {fiscalIncompleto && (
                <div className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    Dados fiscais incompletos. Complete NIF, endereço, código
                    postal e cidade antes de emitir.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linhas */}
          <div className={sectionCls}>
            <LinhasFaturaManager linhas={linhas} onChange={setLinhas} />
          </div>

          {/* Totais */}
          <div className={sectionCls}>
            <Label className={labelCls}>Totais</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal sem IVA</span>
                  <span className="font-medium">
                    {formatCurrencyEUR(totais.subtotal_sem_iva)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Desconto Comercial
                  </span>
                  <span className="font-medium">
                    {formatCurrencyEUR(totais.desconto_comercial)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total sem IVA</span>
                  <span className="font-medium">
                    {formatCurrencyEUR(totais.total_sem_iva)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total IVA</span>
                  <span className="font-medium">
                    {formatCurrencyEUR(totais.total_iva)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-border/60">
                  <span className="font-semibold">Total a Pagar</span>
                  <span className="font-bold text-primary text-base">
                    {formatCurrencyEUR(totais.total_pagar)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wide mb-2">
                  Resumo IVA
                </p>
                {resumoIva.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem IVA aplicado.</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    {resumoIva.map((r) => (
                      <div key={r.taxa} className="flex justify-between">
                        <span className="text-muted-foreground">
                          IVA {r.taxa.toFixed(2).replace(".", ",")}%
                        </span>
                        <span className="font-medium">
                          {formatCurrencyEUR(r.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={emitir}
          disabled={!podeEmitir || submitting}
          className="bg-primary hover:bg-primary/90 shadow-primary/20 h-12 w-full text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {submittingLabel}
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              {submitLabel}
            </>
          )}
        </Button>
        {!cliente && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Selecione um cliente para emitir.
          </p>
        )}
        {cliente && linhasValidas.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Adicione pelo menos uma linha com preço e quantidade.
          </p>
        )}
      </div>
    </div>
  );
}
