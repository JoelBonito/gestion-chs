import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Save, X, Plus, Package, Truck, Info, Euro, Calculator, BarChart3, ChevronDown } from "lucide-react";
import { Produto, CustoBreakdown } from "@/types/database";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { cn } from "@/lib/utils";
import { eurToBrl, brlToEur, formatCurrencyBRL, formatCurrencyEUR } from "@/lib/utils/currency";
import { PRICE_TYPES, PRICE_COLOR_CLASSES, type PriceTypeKey } from "@/lib/config/price-types";
import { CustoBreakdownForm } from "./CustoBreakdownForm";

// Schema de Validação
const produtoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  marca: z.string().min(1, "Marca é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  fornecedor_id: z.string().optional(),
  size_weight: z.coerce.number().min(0, "Peso deve ser positivo"),
  preco_custo: z.coerce.number().min(0, "Preço de custo deve ser positivo"),
  preco_venda: z.coerce.number().min(0, "Preço de venda deve ser positivo"),
  preco_nonato: z.coerce.number().min(0, "Preço nonato deve ser positivo").optional().nullable(),
  preco_tabela: z.coerce.number().min(0).optional().nullable(),
  preco_plus25: z.coerce.number().min(0).optional().nullable(),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  imagem_url: z.string().optional().nullable(),
  estoque_garrafas: z.coerce.number().min(0).default(0),
  estoque_tampas: z.coerce.number().min(0).default(0),
  estoque_rotulos: z.coerce.number().min(0).default(0),
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  onSuccess?: () => void;
  produto?: Produto | null;
  isEditing?: boolean;
}

const SectionStyles =
  "bg-popover border border-border/20 rounded-xl p-5 mb-4 hover:border-primary/50 transition-all duration-300 shadow-sm";
const LabelStyles =
  "text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 mb-1.5";
const InputStyles =
  "bg-accent border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all h-10";

export function ProdutoForm({ onSuccess, produto: produtoProp, isEditing = false }: ProdutoFormProps) {
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>(
    // Seed with the current product's supplier so the Select can display it immediately
    produtoProp?.fornecedor_id && (produtoProp as any).fornecedores
      ? [{ id: produtoProp.fornecedor_id, nome: (produtoProp as any).fornecedores.nome }]
      : []
  );
  const [tipos, setTipos] = useState<string[]>(
    // Seed with the current product's type so the Select can display it immediately
    produtoProp?.tipo ? [produtoProp.tipo] : []
  );
  const [isNewType, setIsNewType] = useState(false);
  const [activeCustoType, setActiveCustoType] = useState<PriceTypeKey | null>(null);
  // Local copy of produto that we can update after saving breakdowns
  const [produto, setProduto] = useState(produtoProp);
  const { isCollaborator } = useIsCollaborator();

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema) as any,
    defaultValues: {
      nome: produto?.nome || "",
      marca: produto?.marca || "",
      tipo: produto?.tipo || "",
      fornecedor_id: produto?.fornecedor_id || undefined,
      size_weight: produto?.size_weight || 0,
      preco_custo: produto?.preco_custo || 0,
      preco_venda: produto?.preco_venda || 0,
      preco_nonato: produto?.preco_nonato ?? undefined,
      preco_tabela: produto?.preco_tabela ?? undefined,
      preco_plus25: produto?.preco_plus25 ?? undefined,
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

  const onSubmit = async (values: ProdutoFormValues) => {
    console.log("🔵 [ProdutoForm] Iniciando onSubmit", { isEditing, produtoId: produto?.id });
    setLoading(true);

    try {
      const payload: any = {
        nome: values.nome,
        marca: values.marca,
        tipo: values.tipo,
        size_weight: Number(values.size_weight) || 0,
        preco_custo: Number(values.preco_custo) || 0,
        preco_venda: Number(values.preco_venda) || 0,
        preco_nonato: values.preco_nonato ? Number(values.preco_nonato) : null,
        preco_tabela: values.preco_tabela ? Number(values.preco_tabela) : null,
        preco_plus25: values.preco_plus25 ? Number(values.preco_plus25) : null,
        ativo: values.ativo,
        descricao: values.descricao || null,
        imagem_url: values.imagem_url || null,
        estoque_garrafas: Number(values.estoque_garrafas) || 0,
        estoque_tampas: Number(values.estoque_tampas) || 0,
        estoque_rotulos: Number(values.estoque_rotulos) || 0,
      };

      if (values.fornecedor_id) {
        payload.fornecedor_id = values.fornecedor_id;
      }

      console.log("🔵 [ProdutoForm] Payload preparado:", payload);

      if (isEditing && produto) {
        console.log("🔵 [ProdutoForm] Executando UPDATE para produto:", produto.id);
        const { data, error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produto.id)
          .select();

        console.log("🔵 [ProdutoForm] Resposta UPDATE:", { data, error });

        if (error) throw error;
        toast.success("Produto atualizado com sucesso");
      } else {
        console.log("🔵 [ProdutoForm] Executando INSERT");
        const { data, error } = await supabase
          .from("produtos")
          .insert(payload)
          .select();

        console.log("🔵 [ProdutoForm] Resposta INSERT:", { data, error });

        if (error) throw error;
        toast.success("Produto criado com sucesso");
      }

      console.log("🟢 [ProdutoForm] Operação concluída com sucesso, chamando onSuccess");
      onSuccess?.();
    } catch (error: any) {
      console.error("🔴 [ProdutoForm] Erro ao salvar produto:", error);
      toast.error(error.message || "Erro ao salvar produto");
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

            {/* Row 2: Preço Custo | Preço 50/50 | Preço Tabela | Preço +25% */}
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="preco_custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <Euro className="h-3 w-3" /> Preço Custo
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className={cn(InputStyles, "tabular-nums")}
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

              {PRICE_TYPES.map((pt) => {
                const colors = PRICE_COLOR_CLASSES[pt.color];
                const fieldName = pt.priceField as "preco_nonato" | "preco_tabela" | "preco_plus25";
                const isDerived = pt.key !== "tabela";
                return (
                  <FormField
                    key={pt.key}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={cn(LabelStyles, colors.text)}>
                          <Euro className={cn("h-3 w-3", colors.text)} /> Preço {pt.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="number"
                            step="0.01"
                            placeholder={isDerived ? "Auto" : "Opcional"}
                            readOnly={isDerived}
                            className={cn(
                              InputStyles, colors.border, colors.text, "tabular-nums",
                              isDerived && "opacity-60 cursor-not-allowed",
                            )}
                          />
                        </FormControl>
                        {(() => {
                          const val = Number(form.watch(fieldName)) || 0;
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
                );
              })}
            </div>

            {/* Row 3: Lucro Real | Lucro 50/50 | Lucro Tabela | Lucro +25% */}
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Lucro Real = preco_venda - preco_custo */}
              {(() => {
                const pv = Number(form.watch("preco_venda")) || 0;
                const pc = Number(form.watch("preco_custo")) || 0;
                const lucro = pv - pc;
                const isPositive = lucro >= 0;
                if (pv <= 0) return <div />;
                return (
                  <div className={cn(
                    "flex flex-col gap-1 rounded-lg border p-2.5 text-xs",
                    isPositive
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-red-500/20 bg-red-500/5"
                  )}>
                    <span className={cn("text-[10px] font-medium", isPositive ? "text-emerald-500" : "text-red-500")}>
                      Lucro Real
                    </span>
                    <span className={cn("text-base font-bold tabular-nums", isPositive ? "text-emerald-500" : "text-red-500")}>
                      {lucro.toFixed(2)}€
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {formatCurrencyBRL(eurToBrl(lucro))}
                    </span>
                  </div>
                );
              })()}

              {/* Dynamic profit cards for each price type */}
              {PRICE_TYPES.map((pt) => {
                const pv = Number(form.watch("preco_venda")) || 0;
                const fieldName = pt.priceField as "preco_nonato" | "preco_tabela" | "preco_plus25";
                const pp = Number(form.watch(fieldName)) || 0;
                const colors = PRICE_COLOR_CLASSES[pt.color];
                if (pv <= 0 || pp <= 0) return <div key={pt.key} />;
                const lucro = pt.profitFormula(pv, pp);
                return (
                  <div key={pt.key} className={cn("flex flex-col gap-1 rounded-lg border p-2.5 text-xs", colors.border, colors.bg)}>
                    <span className={cn("text-[10px] font-medium", colors.textLight)}>
                      {pt.profitLabel}
                    </span>
                    <span className={cn("text-base font-bold tabular-nums", colors.text)}>
                      {lucro.toFixed(2)}€
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {formatCurrencyBRL(eurToBrl(lucro))}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Row 4: Peso | (empty) | Lucro Tabela Nonato | Lucro +25% Nonato */}
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Col 1-2: Peso */}
              <div className="col-span-2 flex items-end">
                <FormField
                  control={form.control}
                  name="size_weight"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-[200px]">
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

              {/* Col 3: Lucro Tabela Nonato */}
              {(() => {
                const tb = produto?.custo_tabela_breakdown as CustoBreakdown | null | undefined;
                if (!tb || !tb.producao_nonato) return <div />;
                const producaoTabela = tb.producao_nonato;
                const producao5050 = Math.round(producaoTabela * 0.80 * 100) / 100;
                const lucroTabelaNonato = producaoTabela - producao5050;
                return (
                  <div className={cn("flex flex-col gap-1 rounded-lg border p-2.5 text-xs", "border-amber-500/20 bg-amber-500/5")}>
                    <span className="text-[10px] font-medium text-amber-400">Lucro Tabela Nonato</span>
                    <span className="text-base font-bold tabular-nums text-amber-500">
                      {formatCurrencyEUR(brlToEur(lucroTabelaNonato))}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {formatCurrencyBRL(lucroTabelaNonato)}
                    </span>
                  </div>
                );
              })()}

              {/* Col 4: Lucro +25% Nonato */}
              {(() => {
                const tb = produto?.custo_tabela_breakdown as CustoBreakdown | null | undefined;
                if (!tb || !tb.producao_nonato) return <div />;
                const producaoTabela = tb.producao_nonato;
                const producao5050 = Math.round(producaoTabela * 0.80 * 100) / 100;
                const producaoPlus25 = Math.round(producaoTabela * 1.25 * 100) / 100;
                const lucroPlus25Nonato = producaoPlus25 - (tb.embalagem + tb.tampa + tb.rotulo + producao5050);
                return (
                  <div className={cn(
                    "flex flex-col gap-1 rounded-lg border p-2.5 text-xs",
                    lucroPlus25Nonato >= 0 ? "border-rose-500/20 bg-rose-500/5" : "border-red-500/20 bg-red-500/5",
                  )}>
                    <span className={cn("text-[10px] font-medium", lucroPlus25Nonato >= 0 ? "text-rose-400" : "text-red-400")}>
                      Lucro +25% Nonato
                    </span>
                    <span className={cn("text-base font-bold tabular-nums", lucroPlus25Nonato >= 0 ? "text-rose-500" : "text-red-500")}>
                      {formatCurrencyEUR(brlToEur(lucroPlus25Nonato))}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {formatCurrencyBRL(lucroPlus25Nonato)}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Editar Custos Dropdown - only in edit mode */}
            {isEditing && produto && (() => {
              const hasTabela = !!produto.custo_tabela_breakdown;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full border border-border/30 hover:bg-muted/50"
                    >
                      <Calculator className="mr-2 h-3.5 w-3.5" />
                      Editar Custos
                      <ChevronDown className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    {PRICE_TYPES.map((pt) => {
                      const colors = PRICE_COLOR_CLASSES[pt.color];
                      const isBlocked = pt.key !== "tabela" && !hasTabela;
                      return (
                        <DropdownMenuItem
                          key={pt.key}
                          onClick={() => !isBlocked && setActiveCustoType(pt.key)}
                          disabled={isBlocked}
                          className={cn(
                            "cursor-pointer",
                            isBlocked ? "opacity-40 cursor-not-allowed" : colors.text,
                          )}
                        >
                          <Calculator className="mr-2 h-3.5 w-3.5" />
                          {pt.sheetTitle}
                          {isBlocked && <span className="ml-auto text-[10px] text-muted-foreground">Preencha Tabela</span>}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>

          {/* Seção 3: Estoque de Insumos */}
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

      {isEditing && produto && activeCustoType && (() => {
        const config = PRICE_TYPES.find((pt) => pt.key === activeCustoType)!;
        const breakdownKey = config.breakdownField as keyof typeof produto;
        const currentBreakdown = produto[breakdownKey] as any;
        // Tabela is the primary form — 50/50 and +25% get auto-filled from Tabela
        const fallback = activeCustoType !== "tabela" ? produto.custo_tabela_breakdown : null;
        return (
          <CustoBreakdownForm
            open={!!activeCustoType}
            onOpenChange={(open) => { if (!open) setActiveCustoType(null); }}
            produtoId={produto.id}
            produtoNome={produto.nome}
            produtoMarca={produto.marca}
            priceType={config}
            breakdown={currentBreakdown}
            fallbackBreakdown={fallback}
            sizeWeight={produto.size_weight || 0}
            estoqueInicial={{
              garrafas: produto.estoque_garrafas || 0,
              tampas: produto.estoque_tampas || 0,
              rotulos: produto.estoque_rotulos || 0,
            }}
            onSaved={() => {
              // Re-fetch full produto to update breakdowns + prices
              supabase
                .from("produtos")
                .select("*")
                .eq("id", produto.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setProduto(data as Produto);
                    if (data.preco_nonato) form.setValue("preco_nonato", data.preco_nonato);
                    if (data.preco_tabela) form.setValue("preco_tabela", data.preco_tabela);
                    if (data.preco_plus25) form.setValue("preco_plus25", data.preco_plus25);
                  }
                });
            }}
          />
        );
      })()}
    </Form>
  );
}
