
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
import { handleEntityInactiveError } from "@/lib/soft-delete-actions";

const encomendaSchema = z.object({
  numero_encomenda: z.string().min(1, "Número da encomenda é obrigatório"),
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
  initialData?: any;
  isEditing?: boolean;
}

export function EncomendaForm({ onSuccess, initialData, isEditing = false }: EncomendaFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesoBruto, setPesoBruto] = useState(0);

  const form = useForm<EncomendaFormData>({
    resolver: zodResolver(encomendaSchema),
    defaultValues: {
      numero_encomenda: "",
      cliente_id: "",
      fornecedor_id: "",
      data_producao_estimada: "",
      data_envio_estimada: "",
      observacoes: "",
    },
  });

  // Calcular peso bruto sempre que os itens mudarem
  useEffect(() => {
    const pesoTotalGramas = itens.reduce((total, item) => {
      return total + (item.quantidade * (item.peso_produto || 0));
    }, 0);
    
    const pesoTotalKg = pesoTotalGramas / 1000;
    const pesoBrutoCalculado = pesoTotalKg * 1.30;
    setPesoBruto(pesoBrutoCalculado);
  }, [itens]);

  // Carregar clientes e fornecedores
  useEffect(() => {
    const fetchData = async () => {
      // Carregar clientes
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("active", true)
        .order("nome");
      
      if (clientesData) {
        console.log("Clientes carregados:", clientesData);
        setClientes(clientesData);
      }

      // Carregar fornecedores
      const { data: fornecedoresData } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("active", true)
        .order("nome");
      
      if (fornecedoresData) {
        console.log("Fornecedores carregados:", fornecedoresData);
        setFornecedores(fornecedoresData);
      }
    };

    fetchData();
  }, []);

  // Carregar dados para edição
  useEffect(() => {
    if (initialData && isEditing) {
      console.log("Carregando dados para edição:", initialData);
      
      // Aguardar um pouco para garantir que clientes e fornecedores foram carregados
      setTimeout(() => {
        // Preencher todos os campos do formulário
        form.reset({
          numero_encomenda: initialData.numero_encomenda || "",
          cliente_id: initialData.cliente_id || "",
          fornecedor_id: initialData.fornecedor_id || "",
          data_producao_estimada: initialData.data_producao_estimada || "",
          data_envio_estimada: initialData.data_envio_estimada || "",
          observacoes: initialData.observacoes || "",
        });

        console.log("Formulário resetado com:", {
          cliente_id: initialData.cliente_id,
          fornecedor_id: initialData.fornecedor_id
        });
      }, 100);

      // Carregar itens da encomenda
      const fetchItens = async () => {
        const { data: itensData, error } = await supabase
          .from("itens_encomenda")
          .select(`
            *,
            produtos(nome, marca, tipo, preco_custo, preco_venda, size_weight)
          `)
          .eq("encomenda_id", initialData.id);

        if (error) {
          console.error("Erro ao carregar itens:", error);
          return;
        }

        if (itensData) {
          const itensFormatados = itensData.map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto_nome: item.produtos ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}` : "",
            quantidade: item.quantidade,
            preco_custo: item.produtos?.preco_custo || 0,
            preco_venda: item.preco_unitario,
            subtotal: item.subtotal,
            peso_produto: item.produtos?.size_weight || 0,
          }));
          console.log("Itens formatados:", itensFormatados);
          setItens(itensFormatados);
        }
      };

      fetchItens();
    }
  }, [initialData, isEditing, form, clientes, fornecedores]);

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 1000);
    form.setValue("numero_encomenda", `ENC-${year}-${random.toString().padStart(3, '0')}`);
  };

  const onSubmit = async (data: EncomendaFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData?.id) {
        console.log("Atualizando encomenda:", initialData.id);
        console.log("Dados do formulário:", data);
        console.log("Itens para salvar:", itens);

        // Atualizar encomenda existente
        const { error } = await supabase
          .from("encomendas")
          .update({
            numero_encomenda: data.numero_encomenda,
            cliente_id: data.cliente_id,
            fornecedor_id: data.fornecedor_id,
            data_producao_estimada: data.data_producao_estimada || null,
            data_envio_estimada: data.data_envio_estimada || null,
            observacoes: data.observacoes || null,
            valor_total: valorTotal,
          })
          .eq("id", initialData.id);

        if (error) throw error;

        // Remover todos os itens existentes e inserir os novos
        const { error: deleteError } = await supabase
          .from("itens_encomenda")
          .delete()
          .eq("encomenda_id", initialData.id);

        if (deleteError) throw deleteError;

        // Inserir novos itens
        for (const item of itens) {
          const { error: itemError } = await supabase
            .from("itens_encomenda")
            .insert([
              {
                encomenda_id: initialData.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_venda,
                produto_nome_snapshot: item.produto_nome,
              },
            ]);

          if (itemError) {
            console.error("Erro ao inserir item:", itemError);
            throw itemError;
          }
        }

        toast.success("Encomenda atualizada com sucesso!");
      } else {
        // Get cliente and fornecedor names for snapshots
        const cliente = clientes.find(c => c.id === data.cliente_id);
        const fornecedor = fornecedores.find(f => f.id === data.fornecedor_id);

        // Criar nova encomenda
        const { data: newEncomenda, error } = await supabase
          .from("encomendas")
          .insert([
            {
              numero_encomenda: data.numero_encomenda,
              cliente_id: data.cliente_id,
              fornecedor_id: data.fornecedor_id,
              data_producao_estimada: data.data_producao_estimada || null,
              data_envio_estimada: data.data_envio_estimada || null,
              observacoes: data.observacoes || null,
              valor_total: valorTotal,
              cliente_nome_snapshot: cliente?.nome || '',
              fornecedor_nome_snapshot: fornecedor?.nome || '',
            },
          ])
          .select()

        if (error) throw error;

        if (newEncomenda && newEncomenda.length > 0) {
          const encomendaId = newEncomenda[0].id;

          // Associar itens à encomenda sem incluir o subtotal (é calculado automaticamente)
          for (const item of itens) {
            const { error: itemError } = await supabase
              .from("itens_encomenda")
              .insert([
                {
                  encomenda_id: encomendaId,
                  produto_id: item.produto_id,
                  quantidade: item.quantidade,
                  preco_unitario: item.preco_venda,
                  produto_nome_snapshot: item.produto_nome,
                },
              ]);

            if (itemError) {
              console.error("Erro ao inserir item:", itemError);
              throw itemError;
            }
          }

          toast.success("Encomenda criada com sucesso!");
        }
      }
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar encomenda:", error);
      
      // Handle specific errors for inactive entities
      if (!handleEntityInactiveError('Cliente/Fornecedor', error)) {
        toast.error("Erro ao salvar encomenda");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Encomenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="numero_encomenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Encomenda *</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="Ex: ENC-2024-001" {...field} />
                          {!isEditing && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={generateOrderNumber}
                              size="sm"
                            >
                              Gerar
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o fornecedor" />
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Campo Peso Bruto */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Peso Bruto</label>
                  <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
                    <span className="font-semibold text-blue-600">
                      {pesoBruto.toFixed(2)} kg
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Peso dos itens × 1,30)
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a encomenda" {...field} />
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
                €{valorTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : (isEditing ? "Atualizar Encomenda" : "Criar Encomenda")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
