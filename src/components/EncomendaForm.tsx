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

const encomendaSchema = z.object({
  numero_encomenda: z.string().min(1, "Número da encomenda é obrigatório"),
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  data_producao_estimada: z.string().optional(),
  data_entrega_estimada: z.string().optional(),
  data_entrega: z.string().optional(),
  observacoes: z.string().optional(),
});

type EncomendaFormData = z.infer<typeof encomendaSchema>;

interface EncomendaFormProps {
  onSuccess?: () => void;
}

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

export function EncomendaForm({ onSuccess }: EncomendaFormProps) {
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
      data_entrega_estimada: "",
      data_entrega: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, fornecedoresRes, encomendasRes] = await Promise.all([
          supabase.from("clientes").select("id, nome"),
          supabase.from("fornecedores").select("id, nome"),
          supabase.from("encomendas").select("numero_encomenda").order("created_at", { ascending: false }).limit(1)
        ]);

        if (clientesRes.data) setClientes(clientesRes.data);
        if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data);
        
        // Gerar próximo número de encomenda
        let proximoNumero = "ENV-001";
        if (encomendasRes.data && encomendasRes.data.length > 0) {
          const ultimaEncomenda = encomendasRes.data[0].numero_encomenda;
          const numero = parseInt(ultimaEncomenda.split("-")[1]) + 1;
          proximoNumero = `ENV-${numero.toString().padStart(3, "0")}`;
        }
        
        form.setValue("numero_encomenda", proximoNumero);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: EncomendaFormData) => {
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item à encomenda");
      return;
    }

    setIsSubmitting(true);
    try {
      // Criar a encomenda
      const { data: encomenda, error: encomendaError } = await supabase
        .from("encomendas")
        .insert([{
          numero_encomenda: data.numero_encomenda,
          cliente_id: data.cliente_id,
          fornecedor_id: data.fornecedor_id,
          valor_total: valorTotal,
          data_producao_estimada: data.data_producao_estimada || null,
          data_entrega_estimada: data.data_entrega_estimada || null,
          data_entrega: data.data_entrega || null,
          observacoes: data.observacoes || null,
        }])
        .select()
        .single();

      if (encomendaError) {
        throw encomendaError;
      }

      // Criar os itens da encomenda
      const itensParaInserir = itens.map(item => ({
        encomenda_id: encomenda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_venda,
        subtotal: item.subtotal,
      }));

      const { error: itensError } = await supabase
        .from("itens_encomenda")
        .insert(itensParaInserir);

      if (itensError) {
        throw itensError;
      }

      toast.success("Encomenda criada com sucesso!");
      form.reset();
      setItens([]);
      setValorTotal(0);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar encomenda:", error);
      toast.error("Erro ao criar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="numero_encomenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Encomenda (Automático)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: ENV-001" {...field} readOnly className="bg-muted" />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="data_entrega_estimada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Entrega Estimada</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_entrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Entrega Efetiva</FormLabel>
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
            disabled={isSubmitting || itens.length === 0}
          >
            {isSubmitting ? "Criando..." : "Criar Encomenda"}
          </Button>
        </form>
      </Form>
    </div>
  );
}