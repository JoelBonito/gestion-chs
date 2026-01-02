import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Package,
  Truck,
  Info,
  Hash,
  User,
  Store,
  Save,
  X,
  Loader2,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";

const transportSchema = z.object({
  numero_encomenda: z.string(),
  cliente_nome: z.string(),
  fornecedor_nome: z.string(),
  data_producao_estimada: z.string().optional(),
  data_envio_estimada: z.string().optional(),
  observacoes: z.string().optional(),
});

type TransportFormData = z.infer<typeof transportSchema>;

interface EncomendaTransportFormProps {
  encomendaId: string;
  onSuccess: () => void;
}

// ============================================
// PALETA DE CORES OFICIAL DO WEB APP
// ============================================
// Fundo Modal: #0f1116
// Fundo Cards/Seções: #1C202A
// Bordas: border-border (tokens do tema)
// Texto Principal: #FFFFFF
// Texto Secundário: #9CA3AF
// Botão Salvar: variant="gradient" (Gradiente #5FCFCF → #3D7A8C)
// ============================================

const SectionStyles =
  "bg-card dark:bg-card border border-border rounded-xl p-5 mb-4 hover:border-primary/50 transition-all duration-300";
const LabelStyles =
  "text-xs font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-2";
const InputStyles =
  "bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring/20";

export function EncomendaTransportForm({ encomendaId, onSuccess }: EncomendaTransportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [pesoParaTransporte, setPesoParaTransporte] = useState(0);

  const form = useForm<TransportFormData>({ resolver: zodResolver(transportSchema) });

  useEffect(() => {
    const fetchEncomendaData = async () => {
      try {
        const { data: encomenda, error: encomendaError } = await supabase
          .from("encomendas")
          .select(`*, clientes(nome), fornecedores(nome)`)
          .eq("id", encomendaId)
          .single();
        if (encomendaError) throw encomendaError;
        form.reset({
          numero_encomenda: encomenda.numero_encomenda,
          cliente_nome: encomenda.clientes?.nome || "",
          fornecedor_nome: encomenda.fornecedores?.nome || "",
          data_producao_estimada: encomenda.data_producao_estimada || "",
          data_envio_estimada: encomenda.data_envio_estimada || "",
          observacoes: encomenda.observacoes || "",
        });
        const { data: itensData, error: itensError } = await supabase
          .from("itens_encomenda")
          .select(`*, produtos(nome, marca, tipo, preco_custo, preco_venda, size_weight)`)
          .eq("encomenda_id", encomendaId);
        if (itensError) throw itensError;
        if (itensData) {
          setItens(
            itensData.map((item: any) => ({
              id: item.id,
              produto_id: item.produto_id,
              produto_nome: item.produtos
                ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}`
                : "",
              quantidade: item.quantidade,
              preco_custo: item.produtos?.preco_custo || 0,
              preco_venda: item.preco_unitario,
              subtotal: item.subtotal,
              peso_produto: item.produtos?.size_weight || 0,
            }))
          );
        }
      } catch (error) {
        console.error("Erro:", error);
        toast.error("Erro ao carregar dados");
      }
    };
    fetchEncomendaData();
  }, [encomendaId, form]);

  useEffect(() => {
    const pesoTotalGramas = itens.reduce(
      (total, item) => total + (Number(item.quantidade) || 0) * (item.peso_produto || 0),
      0
    );
    setPesoParaTransporte((pesoTotalGramas / 1000) * 1.3);
  }, [itens]);

  const onSubmit = async (data: TransportFormData) => {
    setIsSubmitting(true);
    try {
      const { error: encomendaError } = await supabase
        .from("encomendas")
        .update({
          data_producao_estimada: data.data_producao_estimada || null,
          data_envio_estimada: data.data_envio_estimada || null,
          observacoes: data.observacoes || null,
        })
        .eq("id", encomendaId);
      if (encomendaError) throw encomendaError;
      for (const item of itens) {
        if (item.id) {
          const { error: itemError } = await supabase
            .from("itens_encomenda")
            .update({ quantidade: Number(item.quantidade) || 0, preco_unitario: item.preco_venda })
            .eq("id", item.id);
          if (itemError) throw itemError;
        }
      }
      try {
        await sendEmail(
          emailRecipients.geral,
          `🚚 Novo transporte — ${data.numero_encomenda}`,
          emailTemplates.novoTransporte(data.numero_encomenda || "N/A")
        );
      } catch { }
      toast.success("Encomenda atualizada para transporte!");
      onSuccess();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Seção: Identificação Bloqueada */}
          <div className={SectionStyles}>
            <div className="border-border/30 mb-4 flex items-center gap-2 border-b pb-3">
              <Info className="text-primary h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">Identificação</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="numero_encomenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <Hash className="h-3 w-3" /> Nº Encomenda
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className={cn(InputStyles, "bg-muted/30 cursor-not-allowed font-mono")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cliente_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <User className="h-3 w-3" /> Cliente
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className={cn(
                          InputStyles,
                          "bg-muted/30 cursor-not-allowed font-bold uppercase"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fornecedor_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}>
                      <Store className="h-3 w-3" /> Fornecedor
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly
                        className={cn(
                          InputStyles,
                          "bg-muted/30 cursor-not-allowed font-bold uppercase"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Datas */}
            <div className={SectionStyles}>
              <div className="border-border/30 mb-4 flex items-center gap-2 border-b pb-3">
                <CalendarIcon className="text-primary h-4 w-4" />
                <h3 className="text-foreground text-sm font-semibold">Prazos</h3>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="data_producao_estimada"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={LabelStyles}>Data de Produção</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                InputStyles,
                                "w-full justify-between font-bold",
                                !field.value && "text-[#9CA3AF]"
                              )}
                            >
                              {field.value
                                ? format(parseISO(field.value), "dd/MM/yyyy")
                                : "Selecionar..."}
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="bg-background border-border w-auto p-0"
                          align="start"
                        >
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                            onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data_envio_estimada"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={LabelStyles}>Data de Envio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                InputStyles,
                                "w-full justify-between font-bold",
                                !field.value && "text-[#9CA3AF]"
                              )}
                            >
                              {field.value
                                ? format(parseISO(field.value), "dd/MM/yyyy")
                                : "Selecionar..."}
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="bg-background border-border w-auto p-0"
                          align="start"
                        >
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                            onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Peso */}
            <div className={SectionStyles}>
              <div className="border-border/30 mb-4 flex items-center gap-2 border-b pb-3">
                <Calculator className="text-primary h-4 w-4" />
                <h3 className="text-foreground text-sm font-semibold">Cálculo de Carga</h3>
              </div>
              <div className="bg-background border-border flex h-28 flex-col items-center justify-center rounded-xl border p-4 text-center">
                <p className="mb-1 text-xs tracking-wide text-[#9CA3AF] uppercase">
                  Peso p/ Transporte
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary text-3xl font-bold">
                    {pesoParaTransporte.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60">(Itens × 1,30 fator)</p>
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className={SectionStyles}>
            <div className="border-border/30 mb-4 flex items-center gap-2 border-b pb-3">
              <Package className="text-primary h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">Conferência de Produtos</h3>
            </div>
            <ItensEncomendaManager
              itens={itens}
              onItensChange={setItens}
              onValorTotalChange={setValorTotal}
              isTransportMode={true}
            />
          </div>

          <div className={SectionStyles}>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre o transporte..."
                      className={cn(InputStyles, "min-h-[80px] resize-none")}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Rodapé */}
          <div
            className={cn(
              SectionStyles,
              "flex flex-col items-center justify-between gap-4 sm:flex-row"
            )}
          >
            <div className="text-center sm:text-left">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Valor Total Ajustado</p>
              <p className="text-primary text-2xl font-bold">{formatCurrencyEUR(valorTotal)}</p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="cancel"
                className="dark:bg-secondary"
                onClick={onSuccess}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Finalizar
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
