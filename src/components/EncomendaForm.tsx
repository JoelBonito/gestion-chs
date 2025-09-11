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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyEUR } from "@/lib/utils/currency";

const encomendaSchema = z.object({
  numero_encomenda: z.string().min(1, "Número da encomenda é obrigatório"),
  etiqueta: z.string().max(100).regex(/^[A-Za-z0-9\-_ ]*$/, "Apenas letras, números, espaços, hífen e underscore são permitidos").optional().transform(val => val?.trim() || undefined),
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  data_producao_estimada: z.string().optional(),
  data_envio_estimada: z.string().optional(),
  observacoes: z.string().optional(),
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
      observacoes: "",
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
      observacoes: editingData.observacoes || "",
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
          observacoes: data.observacoes || null
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
            observacoes: data.observacoes || null,
            valor_total: valorTotal,
          }])
          .select();
        if (error) throw error;

        if (newEncomenda && newEncomenda.length > 0) {
          const encomendaId = newEncomenda[0].id;
          for (const item of itens) {
            await supabase.from("itens_encomenda").insert([{
              encomenda_id: encomendaId,
              produto_id: item.produto_id,
              quantidade: Math.floor(item.quantidade),
              preco_unitario: item.preco_venda,
              preco_custo: item.preco_custo,
            }]);
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
          <Card>
            <CardHeader><CardTitle>Informações da Encomenda</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero_encomenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Encomenda *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ENC001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="etiqueta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiqueta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: URGENTE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Fornecedor *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_producao_estimada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Produção Estimada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Data de Envio Estimada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <ItensEncomendaManager
            itens={itens}
            onItensChange={setItens}
            onValorTotalChange={setValorTotal}
          />

          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total:</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrencyEUR(valorTotal)}
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : (isEdit ? "Atualizar Encomenda" : "Criar Encomenda")}
          </Button>
        </form>
      </Form>
    </div>
  );
}