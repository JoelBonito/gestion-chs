import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FORNECEDOR_PRODUCAO_ID } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, X, Plus, Package, Truck, Info, Euro, BarChart3, Factory, ChevronDown, Droplets, Tag, Hand, Receipt, CircleDollarSign, TrendingUp } from "lucide-react";
import { Produto } from "@/types/database";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { cn } from "@/lib/utils";
import { eurToBrl, brlToEur, formatCurrencyBRL, formatCurrencyEUR } from "@/lib/utils/currency";
import { calcularCustosAutomaticos } from "@/lib/config/cost-calculations";

// Schema de Validação
const produtoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  marca: z.string().min(1, "Marca é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  fornecedor_id: z.string().optional(),
  size_weight: z.coerce.number().min(0, "Peso deve ser positivo"),
  preco_venda: z.coerce.number().min(0, "Preço de venda deve ser positivo"),
  preco_custo: z.coerce.number().min(0).optional().nullable(),
  custo_producao: z.coerce.number().min(0).optional().nullable(),
  lucro_joel: z.coerce.number().min(0).optional().nullable(),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  imagem_url: z.string().optional().nullable(),
  estoque_garrafas: z.coerce.number().min(0).default(0),
  estoque_tampas: z.coerce.number().min(0).default(0),
  estoque_rotulos: z.coerce.number().min(0).default(0),
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;

type BreakdownFields = {
  garrafa: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  embalagem_carol: number;
  imposto: number;
  diversos: number;
};

const BREAKDOWN_CONFIG: { key: keyof BreakdownFields; label: string; icon: React.ElementType }[] = [
  { key: "garrafa", label: "Garrafa", icon: Package },
  { key: "tampa", label: "Tampa", icon: Droplets },
  { key: "rotulo", label: "Rótulo", icon: Tag },
  { key: "producao_nonato", label: "Produção", icon: Factory },
  { key: "frete_sp", label: "Frete SP", icon: Truck },
  { key: "embalagem_carol", label: "Embalagem Carol", icon: Hand },
  { key: "imposto", label: "Imposto", icon: Receipt },
  { key: "diversos", label: "Diversos", icon: CircleDollarSign },
];

const EMPTY_BREAKDOWN: BreakdownFields = {
  garrafa: 0, tampa: 0, rotulo: 0, producao_nonato: 0,
  frete_sp: 0, embalagem_carol: 0, imposto: 0, diversos: 0,
};

interface ProdutoFormProps {
  onSuccess?: () => void;
  produto?: Produto | null;
  isEditing?: boolean;
}

type ProdutoComFornecedor = Produto & {
  fornecedores?: {
    nome?: string | null;
  } | null;
};

const SectionStyles =
  "bg-popover border border-border/20 rounded-xl p-5 mb-4 hover:border-primary/50 transition-all duration-300 shadow-sm";
const LabelStyles =
  "text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 mb-1.5";
const InputStyles =
  "bg-accent border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all h-10";

export function ProdutoForm({ onSuccess, produto: produtoProp, isEditing = false }: ProdutoFormProps) {
  const produtoWithFornecedor = produtoProp as ProdutoComFornecedor | null | undefined;
  const initialBreakdown = (() => {
    const b = produtoProp?.custo_nonato_breakdown;
    if (b && typeof b === "object") return { ...EMPTY_BREAKDOWN, ...b } as BreakdownFields;
    return { ...EMPTY_BREAKDOWN };
  })();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>(
    // Seed with the current product's supplier so the Select can display it immediately
    produtoProp?.fornecedor_id && produtoWithFornecedor?.fornecedores?.nome
      ? [{ id: produtoProp.fornecedor_id, nome: produtoWithFornecedor.fornecedores.nome }]
      : []
  );
  const [tipos, setTipos] = useState<string[]>(
    // Seed with the current product's type so the Select can display it immediately
    produtoProp?.tipo ? [produtoProp.tipo] : []
  );
  const [isNewType, setIsNewType] = useState(false);
  const [produto, setProduto] = useState(produtoProp);
  const { isCollaborator } = useIsCollaborator();
  const [custoProducaoBRL, setCustoProducaoBRL] = useState(
    produtoProp?.custo_producao
      ? eurToBrl(produtoProp.custo_producao)
      : initialBreakdown.producao_nonato
      ? Number(initialBreakdown.producao_nonato)
      : 0
  );
  const [garrafaIncluso, setGarrafaIncluso] = useState(produtoProp?.garrafa_incluso ?? false);
  const [tampaIncluso, setTampaIncluso] = useState(produtoProp?.tampa_incluso ?? false);

  const [breakdown, setBreakdown] = useState<BreakdownFields>(initialBreakdown);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [lucroRealUltimaProducao, setLucroRealUltimaProducao] = useState<number | null>(null);

  const effectiveBreakdown: BreakdownFields = {
    ...breakdown,
    garrafa: garrafaIncluso ? 0 : Number(breakdown.garrafa) || 0,
    tampa: tampaIncluso ? 0 : Number(breakdown.tampa) || 0,
    producao_nonato: Number(custoProducaoBRL) || 0,
  };

  const breakdownTotalBRL = Object.values(effectiveBreakdown).reduce((s, v) => s + (Number(v) || 0), 0);

  useEffect(() => {
    if (!isEditing || !produtoProp?.id) return;
    supabase
      .from("custos_producao_encomenda")
      .select("lucro_joel_real, updated_at, created_at")
      .eq("produto_id", produtoProp.id)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .then(({ data }) => {
        const latest = data?.[0];
        setLucroRealUltimaProducao(
          latest?.lucro_joel_real != null ? Math.round(latest.lucro_joel_real * 100) / 100 : null
        );
      });
  }, [isEditing, produtoProp?.id]);

  useEffect(() => {
    setBreakdown((prev) =>
      prev.producao_nonato === custoProducaoBRL
        ? prev
        : { ...prev, producao_nonato: custoProducaoBRL }
    );
  }, [custoProducaoBRL]);

  useEffect(() => {
    if (!garrafaIncluso) return;
    setBreakdown((prev) => (prev.garrafa === 0 ? prev : { ...prev, garrafa: 0 }));
  }, [garrafaIncluso]);

  useEffect(() => {
    if (!tampaIncluso) return;
    setBreakdown((prev) => (prev.tampa === 0 ? prev : { ...prev, tampa: 0 }));
  }, [tampaIncluso]);

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: produto?.nome || "",
      marca: produto?.marca || "",
      tipo: produto?.tipo || "",
      fornecedor_id: produto?.fornecedor_id || undefined,
      size_weight: produto?.size_weight || 0,
      preco_venda: produto?.preco_venda || 0,
      preco_custo: produto?.preco_custo ?? undefined,
      custo_producao: produto?.custo_producao ?? undefined,
      lucro_joel: produto?.lucro_joel ?? undefined,
      descricao: produto?.descricao || "",
      ativo: produto?.ativo ?? true,
      imagem_url: produto?.imagem_url || "",
      estoque_garrafas: produto?.estoque_garrafas || 0,
      estoque_tampas: produto?.estoque_tampas || 0,
      estoque_rotulos: produto?.estoque_rotulos || 0,
    },
  });

  useEffect(() => {
    fetchFornecedores();
    fetchTipos();
  }, []);

  const fetchFornecedores = async () => {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .eq("active", true);

    if (error) {
      toast.error("Erro ao carregar fornecedores");
      return;
    }
    setFornecedores(data || []);
  };

  const fetchTipos = async () => {
    const { data, error } = await supabase.from("produtos").select("tipo");

    if (error) return;
    const uniqueTipos = Array.from(new Set(data.map((p) => p.tipo))).filter(Boolean);
    setTipos(uniqueTipos);
  };

  const watchedFornecedorId = form.watch("fornecedor_id");
  const watchedPrecoVenda = Number(form.watch("preco_venda")) || 0;
  const watchedSizeWeight = Number(form.watch("size_weight")) || 0;
  const isProducao = watchedFornecedorId === FORNECEDOR_PRODUCAO_ID;
  const autoCalcValues = useMemo(
    () => (watchedSizeWeight > 0 ? calcularCustosAutomaticos(watchedSizeWeight) : null),
    [watchedSizeWeight]
  );
  const lucroRealCalculadoAtual =
    watchedPrecoVenda > 0
      ? Math.round((watchedPrecoVenda - Math.round(brlToEur(breakdownTotalBRL) * 100) / 100) * 100) / 100
      : null;
  const lucroRealDisplay = lucroRealUltimaProducao ?? lucroRealCalculadoAtual;

  useEffect(() => {
    if (!isProducao || !autoCalcValues) return;
    setBreakdown((prev) => {
      if (
        prev.frete_sp === autoCalcValues.frete_sp &&
        prev.embalagem_carol === autoCalcValues.manuseio_carol &&
        prev.imposto === autoCalcValues.imposto
      ) {
        return prev;
      }
      return {
        ...prev,
        frete_sp: autoCalcValues.frete_sp,
        embalagem_carol: autoCalcValues.manuseio_carol,
        imposto: autoCalcValues.imposto,
      };
    });
  }, [isProducao, autoCalcValues]);

  const onSubmit = async (values: ProdutoFormValues) => {
    console.log("🔵 [ProdutoForm] Iniciando onSubmit", { isEditing, produtoId: produto?.id });
    setLoading(true);

    const submitIsProducao = values.fornecedor_id === FORNECEDOR_PRODUCAO_ID;

    try {
      const payload: Record<string, unknown> = {
        nome: values.nome,
        marca: values.marca,
        tipo: values.tipo,
        size_weight: Number(values.size_weight) || 0,
        preco_venda: Number(values.preco_venda) || 0,
        preco_custo: submitIsProducao ? (produto?.preco_custo || 0) : (Number(values.preco_custo) || 0),
        custo_producao: submitIsProducao
          ? (Number(custoProducaoBRL) > 0 ? brlToEur(custoProducaoBRL) : null)
          : null,
        lucro_joel: submitIsProducao
          ? (Number(values.lucro_joel) || null)
          : (Number(values.preco_venda) - Number(values.preco_custo || 0)) || null,
        ativo: values.ativo,
        descricao: values.descricao || null,
        imagem_url: values.imagem_url || null,
        estoque_garrafas: Number(values.estoque_garrafas) || 0,
        estoque_tampas: Number(values.estoque_tampas) || 0,
        estoque_rotulos: Number(values.estoque_rotulos) || 0,
        garrafa_incluso: submitIsProducao ? garrafaIncluso : false,
        tampa_incluso: submitIsProducao ? tampaIncluso : false,
        custo_nonato_breakdown: submitIsProducao ? effectiveBreakdown : null,
      };

      if (values.fornecedor_id) {
        payload.fornecedor_id = values.fornecedor_id;
      }

      console.log("🔵 [ProdutoForm] Payload preparado:", payload);

      if (isEditing && produto) {
        // Verificar se tem encomendas vinculadas
        const { count, error: countError } = await supabase
          .from("itens_encomenda")
          .select("*", { count: "exact", head: true })
          .eq("produto_id", produto.id);

        if (countError) throw countError;

        if (count && count > 0) {
          const confirmMsg = `⚠️ ALERTA: Este produto possui ${count} encomenda(s) vinculada(s) no histórico!\n\nAlterar os dados deste produto afetará como ele aparece nessas encomendas passadas.\n\nVocê tem certeza que deseja SUBSTITUIR este produto? (Se deseja criar um novo, clique em Cancelar e use a opção Duplicar/Novo).`;
          if (!window.confirm(confirmMsg)) {
            setLoading(false);
            return;
          }
        }

        console.log("🔵 [ProdutoForm] Executando UPDATE para produto:", produto.id);
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produto.id);

        console.log("🔵 [ProdutoForm] Resposta UPDATE:", { error });

        if (error) throw error;
        toast.success("Produto atualizado com sucesso");
      } else {
        console.log("🔵 [ProdutoForm] Executando INSERT");
        const { error } = await supabase
          .from("produtos")
          .insert(payload);

        console.log("🔵 [ProdutoForm] Resposta INSERT:", { error });

        if (error) throw error;
        toast.success("Produto criado com sucesso");
      }

      console.log("🟢 [ProdutoForm] Operação concluída com sucesso, chamando onSuccess");
      onSuccess?.();
    } catch (error: unknown) {
      console.error("🔴 [ProdutoForm] Erro ao salvar produto:", error);
      const message = error instanceof Error ? error.message : "Erro ao salvar produto";
      toast.error(message);
    } finally {
      console.log("🔵 [ProdutoForm] Finalizando (setLoading false)");
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Seção 1: Identificação Básica */}
          <div className={SectionStyles}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <Package className="h-3 w-3" /> Nome do Produto
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Chapa de Aço"
                        className={cn(InputStyles, "font-bold uppercase")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>Marca / Fabricante</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Gerdau"
                        className={cn(InputStyles, "uppercase")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>Tipo / Categoria</FormLabel>
                    <FormControl>
                      {isNewType ? (
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="Digite o novo tipo..."
                            className={cn(InputStyles, "flex-1")}
                            autoFocus
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setIsNewType(false);
                              field.onChange(produto?.tipo || "");
                            }}
                            className="border-border/20 bg-popover hover:bg-muted h-10 w-10 shrink-0 border"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(val) => {
                            if (val === "ADD_NEW") {
                              setIsNewType(true);
                              field.onChange("");
                            } else {
                              field.onChange(val);
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className={InputStyles}>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border/20">
                            <SelectItem
                              value="ADD_NEW"
                              className="text-primary focus:text-primary focus:bg-primary/10 font-bold"
                            >
                              <Plus className="mr-2 inline h-3 w-3" />
                              Adicionar novo tipo...
                            </SelectItem>
                            {tipos.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <Truck className="h-3 w-3" /> Fornecedor Principal
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={InputStyles}>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border/20">
                          {fornecedores.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção 2: Financeiro e Peso */}
          <div className={SectionStyles}>
            {/* Row 1: Preço Venda - Hero Price */}
            <div className="mb-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
              <FormField
                control={form.control}
                name="preco_venda"
                render={({ field }) => (
                  <FormItem className="text-center">
                    <FormLabel className={cn(LabelStyles, "text-primary justify-center text-xs")}>
                      <Euro className="text-primary h-3.5 w-3.5" /> Preço Venda
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className={cn(InputStyles, "border-primary/30 text-primary mx-auto h-14 max-w-xs text-center text-2xl font-bold tabular-nums")}
                      />
                    </FormControl>
                    {(() => {
                      const val = Number(form.watch("preco_venda")) || 0;
                      if (val <= 0) return null;
                      return (
                        <p className="mt-1 text-center text-sm font-medium tabular-nums text-muted-foreground">
                          {formatCurrencyBRL(eurToBrl(val))}
                        </p>
                      );
                    })()}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Custo + Lucro Joel (condicional por fornecedor) */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              {isProducao ? (
                <FormItem>
                  <FormLabel className={cn(LabelStyles, "text-orange-400")}>
                    <Euro className="h-3 w-3 text-orange-400" /> Custo Produção
                  </FormLabel>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={custoProducaoBRL || ""}
                      onChange={(e) => {
                        const brl = parseFloat(e.target.value) || 0;
                        setCustoProducaoBRL(brl);
                        form.setValue("custo_producao", brlToEur(brl));
                      }}
                      className={cn(InputStyles, "border-orange-500/20 text-orange-400 tabular-nums pl-9")}
                    />
                  </div>
                  {(() => {
                    const val = Number(form.watch("custo_producao")) || 0;
                    if (val <= 0) return null;
                    return (
                      <p className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        ~ {formatCurrencyEUR(val)}
                      </p>
                    );
                  })()}
                </FormItem>
              ) : (
                <FormField
                  control={form.control}
                  name="preco_custo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(LabelStyles, "text-orange-400")}>
                        <Euro className="h-3 w-3 text-orange-400" /> Preço Custo
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={cn(InputStyles, "border-orange-500/20 text-orange-400 tabular-nums")}
                        />
                      </FormControl>
                      {(() => {
                        const val = Number(form.watch("preco_custo")) || 0;
                        if (val <= 0) return null;
                        return (
                          <p className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                            {formatCurrencyBRL(eurToBrl(val))}
                          </p>
                        );
                      })()}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isProducao ? (
                <FormField
                  control={form.control}
                  name="lucro_joel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(LabelStyles, "text-emerald-400")}>
                        <Euro className="h-3 w-3 text-emerald-400" /> Lucro Estimado
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={cn(InputStyles, "border-emerald-500/20 text-emerald-400 tabular-nums")}
                        />
                      </FormControl>
                      {(() => {
                        const val = Number(form.watch("lucro_joel")) || 0;
                        if (val <= 0) return null;
                        return (
                          <p className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                            {formatCurrencyBRL(eurToBrl(val))}
                          </p>
                        );
                      })()}
                      <FormMessage />
                      <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
                          Lucro Real
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-sm font-bold tabular-nums",
                            lucroRealDisplay === null
                              ? "text-muted-foreground/40"
                              : lucroRealDisplay >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          )}
                        >
                          {lucroRealDisplay !== null
                            ? formatCurrencyEUR(lucroRealDisplay)
                            : "—"}
                        </div>
                        {lucroRealUltimaProducao === null && lucroRealCalculadoAtual !== null && (
                          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                            Calculado pelo formulário atual
                          </div>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              ) : (
                <div>
                  <div className={cn(LabelStyles, "text-emerald-400")}>
                    <Euro className="h-3 w-3 text-emerald-400" /> Lucro Estimado
                  </div>
                  {(() => {
                    const pv = Number(form.watch("preco_venda")) || 0;
                    const pc = Number(form.watch("preco_custo")) || 0;
                    const lucro = pv - pc;
                    if (pv <= 0) return (
                      <div className={cn(InputStyles, "border-emerald-500/20 text-emerald-400/50 flex items-center tabular-nums opacity-60 cursor-not-allowed")}>
                        0.00
                      </div>
                    );
                    return (
                      <>
                        <div className={cn(InputStyles, "border-emerald-500/20 text-emerald-400 flex items-center font-bold tabular-nums cursor-not-allowed")}>
                          {lucro.toFixed(2)}
                        </div>
                        <p className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                          {formatCurrencyBRL(eurToBrl(lucro))}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Row 3: Toggles Garrafa/Tampa inclusos + Peso */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              {isProducao && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-border/30 bg-accent/30 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Garrafa incluso na produção
                    </span>
                    <Switch
                      checked={garrafaIncluso}
                      onCheckedChange={setGarrafaIncluso}
                      className="h-4 w-7 data-[state=checked]:bg-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/30 bg-accent/30 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tampa incluso na produção
                    </span>
                    <Switch
                      checked={tampaIncluso}
                      onCheckedChange={setTampaIncluso}
                      className="h-4 w-7 data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="size_weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>Peso (g)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className={cn(InputStyles, "tabular-nums")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </div>

          {/* Seção 2b: Custo Real de Produção — só para ONL'US */}
          {isProducao && (
            <div className={cn(SectionStyles, "p-0 overflow-hidden")}>
              {/* Header clicável */}
              <button
                type="button"
                onClick={() => setBreakdownOpen((o) => !o)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Factory className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                    Custo Real de Produção
                  </span>
                  {breakdownTotalBRL > 0 && (
                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-400 tabular-nums">
                      R$ {breakdownTotalBRL.toFixed(2)}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    breakdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Conteúdo expandido */}
              {breakdownOpen && (
                <div className="px-5 pb-5 pt-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {BREAKDOWN_CONFIG.map(({ key, label, icon: Icon }) => (
                      <div key={key}>
                        <div className={cn(LabelStyles, "text-orange-400/80")}>
                          <Icon className="h-3 w-3" />
                          {label}
                        </div>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                            R$
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={
                              key === "producao_nonato"
                                ? custoProducaoBRL || ""
                                : key === "garrafa" && garrafaIncluso
                                ? ""
                                : key === "tampa" && tampaIncluso
                                ? ""
                                : breakdown[key] || ""
                            }
                            onChange={(e) => {
                              if (key === "producao_nonato") return;
                              const val = parseFloat(e.target.value) || 0;
                              setBreakdown((prev) => ({ ...prev, [key]: val }));
                            }}
                            disabled={
                              key === "producao_nonato" ||
                              (key === "garrafa" && garrafaIncluso) ||
                              (key === "tampa" && tampaIncluso)
                            }
                            className={cn(
                              InputStyles,
                              "pl-9 tabular-nums border-orange-500/10 text-orange-300 text-sm",
                              (key === "producao_nonato" ||
                                (key === "garrafa" && garrafaIncluso) ||
                                (key === "tampa" && tampaIncluso)) &&
                                "cursor-not-allowed opacity-60"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total do breakdown */}
                  <div className="flex items-center justify-between rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400/70">
                      Total Custo Produção
                    </span>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-orange-400 tabular-nums">
                        R$ {breakdownTotalBRL.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        ~ {formatCurrencyEUR(Math.round(brlToEur(breakdownTotalBRL) * 100) / 100)}
                      </span>
                    </div>
                  </div>

                  {/* Lucro Real da última produção */}
                  {isEditing && (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
                          Lucro Real da Última Produção
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          lucroRealUltimaProducao === null
                            ? "text-muted-foreground/40"
                            : lucroRealUltimaProducao >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {lucroRealUltimaProducao !== null ? formatCurrencyEUR(lucroRealUltimaProducao) : "—"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className={SectionStyles}>
              <div className="border-border/10 mb-3 flex items-center gap-2 border-b pb-3 text-[10px] font-bold tracking-widest text-cyan-500 uppercase">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Estoque de Insumos</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="estoque_garrafas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(LabelStyles, "text-cyan-500")}>
                        <Package className="h-3 w-3 text-cyan-500" /> Garrafas
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          className={cn(InputStyles, "border-cyan-500/20 text-center tabular-nums")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estoque_tampas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(LabelStyles, "text-cyan-500")}>
                        Tampas
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          className={cn(InputStyles, "border-cyan-500/20 text-center tabular-nums")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estoque_rotulos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(LabelStyles, "text-cyan-500")}>
                        Rótulos
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          className={cn(InputStyles, "border-cyan-500/20 text-center tabular-nums")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Seção 4: Status e Descrição */}
          <div className={SectionStyles}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="border-border/10 bg-popover/30 flex items-center justify-between rounded-lg border p-2.5">
                    <FormLabel className="text-muted-foreground m-0 cursor-pointer text-xs font-bold tracking-wider uppercase">
                      Status Ativo
                    </FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <Info className="h-3 w-3" /> Descrição / Notas
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Informações adicionais..."
                        className={cn(InputStyles, "min-h-[80px] resize-none")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="cancel" onClick={() => onSuccess?.()}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>

          <Button type="submit" variant="gradient" disabled={loading} className="px-8">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Atualizar Produto" : "Criar Produto"}
          </Button>
        </div>
      </form>

    </Form>
  );
}
