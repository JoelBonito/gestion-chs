import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { Package, Truck, Info, Hash, Tag, User, Store, Calendar as CalendarIcon, Save, Calculator } from "lucide-react";

const encomendaSchema = z.object({
  numero_encomenda: z.string().min(1, "Número da encomenda é obrigatório"),
  etiqueta: z.string().max(100).regex(/^[A-Za-z0-9\-_ ]*$/, "Apenas letras, números, espaços, hífen e underscore são permitidos").optional().transform(val => val?.trim() || undefined),
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  data_producao_estimada: z.string().optional(),
  data_envio_estimada: z.string().optional(),
  peso_total: z.number().min(0).optional(),
  valor_frete: z.number().min(0).optional(),
});

type EncomendaFormData = z.infer<typeof encomendaSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface EncomendaFormProps {
  onSuccess: () => void;
  encomenda?: any;
  initialData?: any;
  isEditing?: boolean;
}

export default function EncomendaForm({ onSuccess, encomenda, initialData, isEditing = false }: EncomendaFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesoBruto, setPesoBruto] = useState(0);

  const editingData = encomenda || initialData;
  const isEdit = isEditing || !!editingData;

  const form = useForm<EncomendaFormData>({
    resolver: zodResolver(encomendaSchema),
    defaultValues: {
      numero_encomenda: "",
      etiqueta: "",
      cliente_id: "",
      fornecedor_id: "",
      data_producao_estimada: "",
      data_envio_estimada: "",
      peso_total: 0,
      valor_frete: 0,
    },
  });

  useEffect(() => {
    const pesoTotalGramas = itens.reduce((total, item) => {
      return total + (item.quantidade * (item.peso_produto || 0));
    }, 0);
    setPesoBruto((pesoTotalGramas * 1.30) / 1000);
  }, [itens]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientesData } = await supabase
        .from("clientes").select("id, nome").eq("active", true).order("nome");
      if (clientesData) setClientes(clientesData);

      const { data: fornecedoresData } = await supabase
        .from("fornecedores").select("id, nome").eq("active", true).order("nome");
      if (fornecedoresData) setFornecedores(fornecedoresData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEdit || !editingData) return;

    if (clientes.length === 0 || fornecedores.length === 0) return;

    form.reset({
      numero_encomenda: editingData.numero_encomenda || "",
      etiqueta: editingData.etiqueta || "",
      cliente_id: editingData.cliente_id || "",
      fornecedor_id: editingData.fornecedor_id || "",
      data_producao_estimada: editingData.data_producao_estimada || "",
      data_envio_estimada: editingData.data_envio_estimada || "",
      peso_total: editingData.peso_total || 0,
      valor_frete: editingData.valor_frete || 0,
    });

    // Carrega itens da encomenda
    const fetchItens = async () => {
      const { data: itensData } = await supabase
        .from("itens_encomenda")
        .select(`*, produtos(nome, marca, tipo, preco_custo, preco_venda, size_weight)`)
        .eq("encomenda_id", editingData.id);
      if (itensData) {
        const itensFormatados = itensData.map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produtos ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}` : "Produto não encontrado",
          quantidade: item.quantidade,
          preco_custo: item.preco_custo || 0,
          preco_venda: item.preco_unitario,
          subtotal: item.subtotal || (item.quantidade * item.preco_unitario),
          peso_produto: item.produtos?.size_weight || 0,
        }));
        setItens(itensFormatados);
      }
    };

    fetchItens();
  }, [isEdit, editingData, clientes.length, fornecedores.length]);

  // Ao editar: calcular e preencher Peso Bruto e Valor do Frete conforme o card
  useEffect(() => {
    if (!isEdit) return;
    if (!itens || itens.length === 0) return;

    const totalGramas = itens.reduce((total, item) => total + (item.quantidade * (item.peso_produto || 0)), 0);
    const pesoKg = (totalGramas * 1.30) / 1000; // mesmo cálculo do card
    const tarifaPorKg = 4.5; // mesma taxa usada na lista
    const frete = pesoKg * tarifaPorKg;

    form.setValue("peso_total", Number(pesoKg.toFixed(2)));
    form.setValue("valor_frete", Number(frete.toFixed(2)));
  }, [isEdit, itens, form]);

  const onSubmit = async (data: EncomendaFormData) => {
    setIsSubmitting(true);
    try {
      if (itens.length === 0) {
        toast.error("Adicione pelo menos um item à encomenda antes de salvá-la.");
        setIsSubmitting(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error("Faça login para salvar a encomenda.");
        setIsSubmitting(false);
        return;
      }

      if (isEdit && editingData?.id) {
        const payloadEncomenda = {
          id: editingData.id,
          numero_encomenda: data.numero_encomenda,
          etiqueta: data.etiqueta || null,
          cliente_id: data.cliente_id,
          fornecedor_id: data.fornecedor_id,
          data_envio_estimada: data.data_envio_estimada || null,
          data_producao_estimada: data.data_producao_estimada || null,
          peso_total: data.peso_total || 0,
          valor_frete: data.valor_frete || 0,
        };

        const itensParaSalvar = itens.map(item => ({
          ...(item.id ? { id: item.id } : {}),
          produto_id: item.produto_id,
          quantidade: Math.floor(Number(item.quantidade)) || 0,
          preco_unitario: Number(item.preco_venda) || 0,
          preco_custo: Number(item.preco_custo) || 0,
        }));

        const { error: updateError } = await supabase.rpc('salvar_edicao_encomenda', {
          p_encomenda_id: editingData.id,
          p_dados: payloadEncomenda,
          p_itens: itensParaSalvar
        });
        if (updateError) throw updateError;

        toast.success("Encomenda atualizada com sucesso!");
      } else {
        const { data: newEncomenda, error } = await supabase
          .from("encomendas")
          .insert([{
            numero_encomenda: data.numero_encomenda,
            etiqueta: data.etiqueta || null,
            cliente_id: data.cliente_id,
            fornecedor_id: data.fornecedor_id,
            data_producao_estimada: data.data_producao_estimada || null,
            data_envio_estimada: data.data_envio_estimada || null,
            valor_total: valorTotal,
            peso_total: data.peso_total || 0,
            valor_frete: data.valor_frete || 0,
          }])
          .select();
        if (error) throw error;

        if (newEncomenda && newEncomenda.length > 0) {
          const encomendaId = newEncomenda[0].id;

          // UUID do fornecedor de produção
          const FORNECEDOR_PRODUCAO_ID = 'b8f995d2-47dc-4c8f-9779-ce21431f5244';

          for (const item of itens) {
            await supabase.from("itens_encomenda").insert([{
              encomenda_id: encomendaId,
              produto_id: item.produto_id,
              quantidade: Math.floor(item.quantidade),
              preco_unitario: item.preco_venda,
              preco_custo: item.preco_custo,
            }]);
          }

          // Deduzir estoque se a encomenda for para o fornecedor de produção
          if (data.fornecedor_id === FORNECEDOR_PRODUCAO_ID) {
            for (const item of itens) {
              // Buscar produto para verificar se pertence ao fornecedor alvo
              const { data: produto } = await supabase
                .from('produtos')
                .select('fornecedor_id, estoque_garrafas, estoque_tampas, estoque_rotulos')
                .eq('id', item.produto_id)
                .single();

              // Só deduzir se produto pertence ao fornecedor alvo
              if (produto?.fornecedor_id === FORNECEDOR_PRODUCAO_ID) {
                const quantidade = Math.floor(item.quantidade);
                const novoEstoqueGarrafas = (produto.estoque_garrafas || 0) - quantidade;
                const novoEstoqueTampas = (produto.estoque_tampas || 0) - quantidade;
                const novoEstoqueRotulos = (produto.estoque_rotulos || 0) - quantidade;

                await supabase
                  .from('produtos')
                  .update({
                    estoque_garrafas: novoEstoqueGarrafas,
                    estoque_tampas: novoEstoqueTampas,
                    estoque_rotulos: novoEstoqueRotulos,
                  })
                  .eq('id', item.produto_id);
              }
            }
          }

          // Enviar notificação por email
          try {
            const clienteNome = clientes.find(c => c.id === data.cliente_id)?.nome || 'Cliente não encontrado';
            const fornecedorNome = fornecedores.find(f => f.id === data.fornecedor_id)?.nome || 'Fornecedor não encontrado';
            const produtos = itens.map(item => ({ nome: item.produto_nome, quantidade: item.quantidade }));

            await sendEmail(
              emailRecipients.geral,
              `📦 Nova encomenda criada — ${data.numero_encomenda}`,
              emailTemplates.novaEncomenda(data.numero_encomenda, data.etiqueta || 'N/A', clienteNome, fornecedorNome, produtos)
            );
          } catch (emailError) {
            console.error("Erro ao enviar email de notificação:", emailError);
            // Não exibir erro de email para não atrapalhar o fluxo principal
          }

          toast.success("Encomenda criada com sucesso!");
        }
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Informações Principais */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Informações da Encomenda</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="numero_encomenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        Número da Encomenda *
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Ex: ENC001" {...field} className="bg-background/50" />
                        </FormControl>
                        {!isEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase
                                  .from("encomendas")
                                  .select("numero_encomenda")
                                  .order("created_at", { ascending: false })
                                  .limit(1);

                                if (error) throw error;

                                let proximoNumero = "ENC001";

                                if (data && data.length > 0) {
                                  const ultimoNumero = data[0].numero_encomenda;
                                  const match = ultimoNumero.match(/ENC(\d+)/);
                                  if (match) {
                                    const numero = parseInt(match[1]) + 1;
                                    proximoNumero = `ENC${numero.toString().padStart(3, '0')}`;
                                  }
                                }

                                form.setValue("numero_encomenda", proximoNumero);
                                toast.success("Número gerado automaticamente!");
                              } catch (error) {
                                console.error("Erro ao gerar número:", error);
                                toast.error("Erro ao gerar número automático");
                              }
                            }}
                            className="whitespace-nowrap gap-2 bg-secondary/50 border-secondary hover:bg-secondary/70"
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            Auto
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="etiqueta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        Etiqueta
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: URGENTE" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Cliente *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fornecedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                        Fornecedor *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fornecedores.map((fornecedor) => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="data_producao_estimada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        Data de Produção Estimada
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_envio_estimada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        Data de Envio Estimada
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campos específicos para edição - Visualização suave */}
              {isEdit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <FormField
                    control={form.control}
                    name="peso_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          Peso Bruto (kg)
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center justify-center p-3 rounded-lg border border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {field.value ? `${field.value} kg` : '0.00 kg'}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor_frete"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          Valor Frete (€)
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center justify-center p-3 rounded-lg border border-amber-100 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                              {field.value ? `${field.value.toFixed(2)}€` : '0.00€'}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </GlassCard>

          <ItensEncomendaManager
            itens={itens}
            onItensChange={setItens}
            onValorTotalChange={setValorTotal}
          />

          <GlassCard className="p-4 border-t-0 rounded-t-none mt-0 bg-primary/5 dark:bg-primary/10 border border-primary/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Verifique todas as informações antes de salvar.</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Valor Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrencyEUR(valorTotal)}
                  </p>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="min-w-[200px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Salvando..."
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {isEdit ? "Atualizar Encomenda" : "Criar Encomenda"}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        </form>
      </Form>
    </div>
  );
}