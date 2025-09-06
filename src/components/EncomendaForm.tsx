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

export function EncomendaForm({ onSuccess, encomenda, initialData, isEditing = false }: EncomendaFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesoBruto, setPesoBruto] = useState(0);

  // Determinar se está editando baseado na presença de dados
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

  // Calcular peso bruto sempre que os itens mudarem
  useEffect(() => {
    const pesoTotalGramas = itens.reduce((total, item) => {
      return total + (item.quantidade * (item.peso_produto || 0));
    }, 0);
    
    // Multiplicar por 1.30 e converter para kg: (gramas * 1.30) / 1000
    const pesoBrutoCalculado = (pesoTotalGramas * 1.30) / 1000;
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
    if (editingData && isEdit) {
      console.log("Carregando dados para edição:", editingData);
      
      // Aguardar um pouco para garantir que clientes e fornecedores foram carregados
      setTimeout(() => {
        // Preencher todos os campos do formulário
        form.reset({
          numero_encomenda: editingData.numero_encomenda || "",
          etiqueta: editingData.etiqueta || "",
          cliente_id: editingData.cliente_id || "",
          fornecedor_id: editingData.fornecedor_id || "",
          data_producao_estimada: editingData.data_producao_estimada || "",
          data_envio_estimada: editingData.data_envio_estimada || "",
          observacoes: editingData.observacoes || "",
        });

        console.log("Formulário resetado com:", {
          cliente_id: editingData.cliente_id,
          fornecedor_id: editingData.fornecedor_id
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
          .eq("encomenda_id", editingData.id);

        if (error) {
          console.error("Erro ao carregar itens:", error);
          return;
        }

        if (itensData && itensData.length > 0) {
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
          console.log("Itens formatados para edição:", itensFormatados);
          setItens(itensFormatados);
        } else {
          console.log("Nenhum item encontrado para esta encomenda");
          setItens([]);
        }
      };

      fetchItens();
    }
  }, [editingData, isEdit, form, clientes, fornecedores]);

  const generateOrderNumber = async () => {
    const now = new Date();
    const year = now.getFullYear();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      let orderNumber;
      
      if (attempts === 0) {
        // First attempt: use random number
        const random = Math.floor(Math.random() * 1000);
        orderNumber = `ENC-${year}-${random.toString().padStart(3, '0')}`;
      } else {
        // Subsequent attempts: use timestamp to ensure uniqueness
        orderNumber = `ENC-${Date.now()}`;
      }
      
      // Check if this number already exists for the current user
      const { data: existingOrder } = await supabase
        .from('encomendas')
        .select('numero_encomenda')
        .eq('numero_encomenda', orderNumber)
        .maybeSingle();
      
      if (!existingOrder) {
        // Number is unique, use it
        form.setValue("numero_encomenda", orderNumber);
        return;
      }
      
      attempts++;
    }
    
    // Fallback: use timestamp if all attempts failed
    const fallbackNumber = `ENC-${Date.now()}`;
    form.setValue("numero_encomenda", fallbackNumber);
  };

  const validateUniqueOrderNumber = async (orderNumber: string): Promise<boolean> => {
    if (isEdit && editingData?.numero_encomenda === orderNumber) {
      // If editing and number hasn't changed, it's valid
      return true;
    }
    
    const { data: existingOrder } = await supabase
      .from('encomendas')
      .select('numero_encomenda')
      .eq('numero_encomenda', orderNumber)
      .maybeSingle();
      
    return !existingOrder;
  };

  const generateUniqueOrderNumber = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      let orderNumber;
      
      if (attempts === 0) {
        const now = new Date();
        const year = now.getFullYear();
        const random = Math.floor(Math.random() * 1000);
        orderNumber = `ENC-${year}-${random.toString().padStart(3, '0')}`;
      } else {
        orderNumber = `ENC-${Date.now()}`;
      }
      
      const isUnique = await validateUniqueOrderNumber(orderNumber);
      if (isUnique) {
        return orderNumber;
      }
      
      attempts++;
    }
    
    // Fallback
    return `ENC-${Date.now()}`;
  };

  const onSubmit = async (data: EncomendaFormData) => {
    setIsSubmitting(true);
    try {
      // Validar se há itens na encomenda
      if (itens.length === 0) {
        toast.error("Adicione pelo menos um item à encomenda antes de salvá-la.");
        setIsSubmitting(false);
        return;
      }

      // 1. Verificar sessão ativa
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error("Faça login para salvar a encomenda.");
        setIsSubmitting(false);
        return;
      }

      // 2. Validar cliente e fornecedor
      const [{ data: clienteOk }, { data: fornecedorOk }] = await Promise.all([
        supabase.from("clientes").select("id").eq("id", data.cliente_id).maybeSingle(),
        supabase.from("fornecedores").select("id").eq("id", data.fornecedor_id).maybeSingle(),
      ]);

      if (!clienteOk) {
        toast.error("Cliente inválido ou inativo.");
        setIsSubmitting(false);
        return;
      }
      if (!fornecedorOk) {
        toast.error("Fornecedor inválido ou inativo.");
        setIsSubmitting(false);
        return;
      }

      // 3. Verificar duplicação de número da encomenda e gerar novo se necessário
      if (!isEdit) {
        const isUniqueNumber = await validateUniqueOrderNumber(data.numero_encomenda);
        if (!isUniqueNumber) {
          const newUniqueNumber = await generateUniqueOrderNumber();
          data.numero_encomenda = newUniqueNumber;
          form.setValue("numero_encomenda", newUniqueNumber);
          toast.info(`Número da encomenda alterado para ${newUniqueNumber} para evitar duplicação.`);
        }
      }

      // 3. Validate client and supplier are active and belong to user
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('id', data.cliente_id)
        .maybeSingle();

      if (!clienteData) {
        toast.error("Cliente inválido ou inativo. Verifique se o cliente está ativo.");
        return;
      }

      const { data: fornecedorData } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('id', data.fornecedor_id)
        .maybeSingle();

      if (!fornecedorData) {
        toast.error("Fornecedor inválido ou inativo. Verifique se o fornecedor está ativo.");
        return;
      }

      if (isEdit && editingData?.id) {
        console.log("Atualizando encomenda:", editingData.id);
        console.log("Dados do formulário:", data);
        console.log("Itens para salvar:", itens);

        // Preparar dados para a RPC (nova assinatura)
        const payloadEncomenda = {
          id: editingData.id, // ID da encomenda para edição
          numero_encomenda: data.numero_encomenda,
          etiqueta: data.etiqueta || null,
          cliente_id: data.cliente_id,
          fornecedor_id: data.fornecedor_id,
          data_envio_estimada: data.data_envio_estimada || null,
          data_producao_estimada: data.data_producao_estimada || null,
          observacoes: data.observacoes || null
        };

        // Preparar itens para salvar (incluindo preco_custo)
        const itensParaSalvar = itens
          .filter(item => item.produto_id) // Filtrar itens sem produto
          .map(item => ({
            ...(item.id ? { id: item.id } : {}), // Inclui ID se existir
            produto_id: item.produto_id,
            quantidade: Math.floor(Number(item.quantidade)) || 0,
            preco_unitario: Number(item.preco_venda) || 0,
            preco_custo: Number(item.preco_custo) || 0,
          }));

        console.log("Payload encomenda para RPC:", payloadEncomenda);
        console.log("Itens para RPC:", itensParaSalvar);

        // Chamar função RPC com assinatura correta (3 parâmetros)
        const { data: resultado, error: updateError } = await supabase.rpc('salvar_edicao_encomenda', {
          p_encomenda_id: editingData.id,
          p_dados: payloadEncomenda,
          p_itens: itensParaSalvar
        });

        if (updateError) {
          console.error('Erro ao salvar edição:', updateError);
          if (updateError.code === '42501') {
            toast.error('Você não tem permissão para editar esta encomenda');
          } else if (updateError.code === 'P0002') {
            toast.error('Encomenda não encontrada');
          } else {
            toast.error('Erro ao salvar alterações: ' + (updateError.message || 'Erro desconhecido'));
          }
          throw updateError;
        }

        if (resultado && resultado.length > 0) {
          console.log('Resultado da RPC:', resultado[0]);
          const dadosAtualizados = resultado[0];
          toast.success(`Encomenda atualizada com sucesso! Valor total: R$ ${dadosAtualizados.valor_total}`);
        } else {
          toast.success("Encomenda atualizada com sucesso!");
        }
      } else {
        // Criar nova encomenda with validated data
        const { data: newEncomenda, error } = await supabase
          .from("encomendas")
          .insert([
            {
              numero_encomenda: data.numero_encomenda,
              etiqueta: data.etiqueta || null,
              cliente_id: data.cliente_id,
              fornecedor_id: data.fornecedor_id,
              cliente_nome: clienteData.nome,
              fornecedor_nome: fornecedorData.nome,
              data_producao_estimada: data.data_producao_estimada || null,
              data_envio_estimada: data.data_envio_estimada || null,
              observacoes: data.observacoes || null,
              valor_total: valorTotal,
            },
          ])
          .select()

        if (error) throw error;

        if (newEncomenda && newEncomenda.length > 0) {
          const encomendaId = newEncomenda[0].id;

          // Associar itens à encomenda sem incluir o subtotal (é calculado automaticamente)
          for (const item of itens) {
            if (!item.produto_id) {
              console.warn("Item sem produto_id, pulando:", item);
              continue;
            }
            
            const { error: itemError } = await supabase
              .from("itens_encomenda")
              .insert([
                {
                  encomenda_id: encomendaId,
                  produto_id: item.produto_id,
                  quantidade: Math.floor(item.quantidade),
                  preco_unitario: item.preco_venda,
                  preco_custo: item.preco_custo,
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
      
      // Handle specific error cases
      if (error.code === '42501' || error.code === 'PGRST301') {
        toast.error("Permissão negada. Verifique se você tem acesso aos dados.");
      } else if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
        toast.error("Cliente ou fornecedor inválido ou inativo. Verifique se ambos estão ativos e pertencem a você.");
      } else if (error.code === '23503') {
        toast.error("Erro de referência: cliente ou fornecedor não encontrado.");
      } else if (!handleEntityInactiveError('Cliente/Fornecedor', error)) {
        toast.error(error.message || "Erro ao salvar encomenda");
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
                          {!isEdit && (
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
                  name="etiqueta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiqueta</FormLabel>
                      <FormControl>
                        <Input placeholder="ETQ-CLIENTE-001" maxLength={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {isSubmitting ? "Salvando..." : (isEdit ? "Atualizar Encomenda" : "Criar Encomenda")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
