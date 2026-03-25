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
import { Loader2, Save, X, Plus, Package, Truck, Info, Euro, BarChart3 } from "lucide-react";
import { Produto } from "@/types/database";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { cn } from "@/lib/utils";
import { eurToBrl, brlToEur, formatCurrencyBRL, formatCurrencyEUR } from "@/lib/utils/currency";

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
  const [produto, setProduto] = useState(produtoProp);
  const { isCollaborator } = useIsCollaborator();
  const [custoProducaoBRL, setCustoProducaoBRL] = useState(
    produtoProp?.custo_producao ? Math.round(eurToBrl(produtoProp.custo_producao) * 100) / 100 : 0
  );
  const [garrafaIncluso, setGarrafaIncluso] = useState(produtoProp?.garrafa_incluso ?? false);
  const [tampaIncluso, setTampaIncluso] = useState(produtoProp?.tampa_incluso ?? false);

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema) as any,
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
  const isProducao = watchedFornecedorId === FORNECEDOR_PRODUCAO_ID;

  const onSubmit = async (values: ProdutoFormValues) => {
    console.log("🔵 [ProdutoForm] Iniciando onSubmit", { isEditing, produtoId: produto?.id });
    setLoading(true);

    const submitIsProducao = values.fornecedor_id === FORNECEDOR_PRODUCAO_ID;

    try {
      const payload: any = {
        nome: values.nome,
        marca: values.marca,
        tipo: values.tipo,
        size_weight: Number(values.size_weight) || 0,
        preco_venda: Number(values.preco_venda) || 0,
        preco_custo: submitIsProducao ? (produto?.preco_custo || 0) : (Number(values.preco_custo) || 0),
        custo_producao: submitIsProducao ? (Number(values.custo_producao) || null) : null,
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
      };

      if (values.fornecedor_id) {
        payload.fornecedor_id = values.fornecedor_id;
      }

      console.log("🔵 [ProdutoForm] Payload preparado:", payload);

      if (isEditing && produto) {
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
                        form.setValue("custo_producao", Math.round(brlToEur(brl) * 100) / 100);
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
                        <Euro className="h-3 w-3 text-emerald-400" /> Lucro Joel
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
                    </FormItem>
                  )}
                />
              ) : (
                <div>
                  <div className={cn(LabelStyles, "text-emerald-400")}>
                    <Euro className="h-3 w-3 text-emerald-400" /> Lucro Joel
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

    </Form>
  );
}
