import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
import { ClienteFormDialog } from "./ClienteFormDialog";
import { FornecedorFormDialog } from "./FornecedorFormDialog";

const encomendaSchema = z.object({
  numero_encomenda: z.string().optional(),
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  data_producao_estimada: z.string().optional(),
  data_envio_estimada: z.string().optional(),
  observacoes: z.string().optional(),
});

type EncomendaFormData = z.infer<typeof encomendaSchema>;

interface EncomendaFormProps {
  onSuccess?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

export function EncomendaForm({ onSuccess, initialData, isEditing = false }: EncomendaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);

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

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("active", true)
        .order("nome");
      
      if (error) throw error;
      if (data) setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("active", true)
        .order("nome");
      
      if (error) throw error;
      if (data) setFornecedores(data);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchClientes(), fetchFornecedores()]);
      
      // Só gerar próximo número se não estiver editando
      if (!isEditing && !initialData) {
        try {
          const { data: encomendasRes } = await supabase
            .from("encomendas")
            .select("numero_encomenda")
            .order("created_at", { ascending: false })
            .limit(1);
          
          let proximoNumero = "ENV-001";
          if (encomendasRes && encomendasRes.length > 0) {
            const ultimaEncomenda = encomendasRes[0].numero_encomenda;
            const numero = parseInt(ultimaEncomenda.split("-")[1]) + 1;
            proximoNumero = `ENV-${numero.toString().padStart(3, "0")}`;
          }
          
          form.setValue("numero_encomenda", proximoNumero);
        } catch (error) {
          console.error("Erro ao gerar número da encomenda:", error);
        }
      }
    };

    fetchData();
  }, [isEditing, initialData, form]);

  useEffect(() => {
    if (initialData) {
      // Carregar dados da encomenda para edição
      const hoje = new Date();
      const dataProducao = new Date(hoje);
      dataProducao.setDate(hoje.getDate() + 45);
      const dataEnvio = new Date(hoje);
      dataEnvio.setDate(hoje.getDate() + 60);

      const formData = {
        numero_encomenda: initialData.numero_encomenda || "",
        cliente_id: initialData.cliente_id || "",
        fornecedor_id: initialData.fornecedor_id || "",
        data_producao_estimada: initialData.data_producao_estimada || dataProducao.toISOString().split('T')[0],
        data_envio_estimada: initialData.data_envio_estimada || dataEnvio.toISOString().split('T')[0],
        observacoes: initialData.observacoes || "",
      };
      
      setTimeout(() => {
        form.reset(formData);
      }, 200);
      
      setValorTotal(initialData.valor_total || 0);

      // Carregar itens da encomenda
      fetchItensEncomenda();
    } else if (!isEditing) {
      // Definir datas automáticas para nova encomenda
      const hoje = new Date();
      const dataProducao = new Date(hoje);
      dataProducao.setDate(hoje.getDate() + 45);
      const dataEnvio = new Date(hoje);
      dataEnvio.setDate(hoje.getDate() + 60);

      form.setValue("data_producao_estimada", dataProducao.toISOString().split('T')[0]);
      form.setValue("data_envio_estimada", dataEnvio.toISOString().split('T')[0]);
    }
  }, [initialData, form, isEditing]);

  const fetchItensEncomenda = async () => {
    if (!initialData?.id) return;

    try {
      const { data, error } = await supabase
        .from("itens_encomenda")
        .select(`
          *,
          produtos(nome, marca, tipo, preco_custo)
        `)
        .eq("encomenda_id", initialData.id);

      if (error) throw error;

      if (data) {
        const itensFormatados = data.map((item: any) => ({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: item.produtos ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}` : "",
          quantidade: item.quantidade,
          preco_custo: item.produtos?.preco_custo || 0,
          preco_venda: item.preco_unitario,
          subtotal: item.subtotal,
        }));
        setItens(itensFormatados);
      }
    } catch (error) {
      console.error("Erro ao carregar itens da encomenda:", error);
      toast.error("Erro ao carregar itens da encomenda");
    }
  };

  const handleClienteCreated = () => {
    fetchClientes(); // Refresh the clients list
    toast.success("Cliente criado com sucesso!");
  };

  const handleFornecedorCreated = () => {
    fetchFornecedores(); // Refresh the suppliers list
    toast.success("Fornecedor criado com sucesso!");
  };

  const onSubmit = async (data: EncomendaFormData) => {
    if (itens.length === 0 && !isEditing) {
      toast.error("Adicione pelo menos um item à encomenda");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        // Atualizar encomenda existente
        const { error: encomendaError } = await supabase
          .from("encomendas")
          .update({
            numero_encomenda: data.numero_encomenda,
            cliente_id: data.cliente_id,
            fornecedor_id: data.fornecedor_id,
            data_producao_estimada: data.data_producao_estimada || null,
            data_envio_estimada: data.data_envio_estimada || null,
            observacoes: data.observacoes || null,
          })
          .eq("id", initialData.id);

        if (encomendaError) throw encomendaError;

        // Deletar todos os itens existentes da encomenda
        const { error: deleteError } = await supabase
          .from("itens_encomenda")
          .delete()
          .eq("encomenda_id", initialData.id);

        if (deleteError) throw deleteError;

        // Inserir os novos itens
        if (itens.length > 0) {
          const itensParaInserir = itens.map(item => ({
            encomenda_id: initialData.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_venda,
          }));

          const { error: itensError } = await supabase
            .from("itens_encomenda")
            .insert(itensParaInserir);

          if (itensError) throw itensError;
        }

        toast.success("Encomenda atualizada com sucesso!");
      } else {
        // Criar nova encomenda
        const { data: encomenda, error: encomendaError } = await supabase
          .from("encomendas")
          .insert([{
            numero_encomenda: data.numero_encomenda,
            cliente_id: data.cliente_id,
            fornecedor_id: data.fornecedor_id,
            valor_total: valorTotal,
            data_producao_estimada: data.data_producao_estimada || null,
            data_envio_estimada: data.data_envio_estimada || null,
            observacoes: data.observacoes || null,
          }])
          .select()
          .single();

        if (encomendaError) throw encomendaError;

        // Criar os itens da encomenda
        if (itens.length > 0) {
          const itensParaInserir = itens.map(item => ({
            encomenda_id: encomenda.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_venda,
          }));

          const { error: itensError } = await supabase
            .from("itens_encomenda")
            .insert(itensParaInserir);

          if (itensError) throw itensError;
        }

        toast.success("Encomenda criada com sucesso!");
        form.reset();
        setItens([]);
        setValorTotal(0);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar encomenda:", error);
      toast.error("Erro ao salvar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="numero_encomenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Encomenda</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: ENV-001" 
                      {...field} 
                      readOnly 
                      className="bg-muted" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
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
                      <ClienteFormDialog onClienteCreated={handleClienteCreated} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
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
                      <FornecedorFormDialog onFornecedorCreated={handleFornecedorCreated} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

          <ItensEncomendaManager
            itens={itens}
            onItensChange={setItens}
            onValorTotalChange={setValorTotal}
          />

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

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={isSubmitting || (!isEditing && itens.length === 0)}
          >
            {isSubmitting ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Encomenda")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
