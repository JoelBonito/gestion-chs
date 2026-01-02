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
import { Loader2, Save, X, Plus, Package, Truck, Info, Euro } from "lucide-react";
import { Produto } from "@/types/database";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { cn } from "@/lib/utils";

// Schema de Validação
const produtoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  marca: z.string().min(1, "Marca é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  fornecedor_id: z.string().optional(),
  size_weight: z.coerce.number().min(0, "Peso deve ser positivo"),
  preco_custo: z.coerce.number().min(0, "Preço de custo deve ser positivo"),
  preco_venda: z.coerce.number().min(0, "Preço de venda deve ser positivo"),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  imagem_url: z.string().optional().nullable(),
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

export function ProdutoForm({ onSuccess, produto, isEditing = false }: ProdutoFormProps) {
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [isNewType, setIsNewType] = useState(false);
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
      descricao: produto?.descricao || "",
      ativo: produto?.ativo ?? true,
      imagem_url: produto?.imagem_url || "",
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
    setLoading(true);
    try {
      const payload: any = {
        nome: values.nome,
        marca: values.marca,
        tipo: values.tipo,
        size_weight: Number(values.size_weight) || 0,
        preco_custo: Number(values.preco_custo) || 0,
        preco_venda: Number(values.preco_venda) || 0,
        ativo: values.ativo,
        descricao: values.descricao || null,
        imagem_url: values.imagem_url || null,
      };

      if (values.fornecedor_id) {
        payload.fornecedor_id = values.fornecedor_id;
      }

      if (isEditing && produto) {
        const { error } = await supabase.from("produtos").update(payload).eq("id", produto.id);
        if (error) throw error;
        toast.success("Produto atualizado com sucesso");
      } else {
        const { error } = await supabase.from("produtos").insert(payload);
        if (error) throw error;
        toast.success("Produto criado com sucesso");
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
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
                          defaultValue={field.value}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preco_venda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(LabelStyles, "text-primary")}>
                      <Euro className="text-primary h-3 w-3" /> Preço Venda
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className={cn(InputStyles, "border-primary/20 text-primary tabular-nums")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

          {/* Seção 3: Status e Descrição */}
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
