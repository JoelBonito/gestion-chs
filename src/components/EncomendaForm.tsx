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

const encomendaSchema = z.object({
  numero_encomenda: z.string().min(1, "Número da encomenda é obrigatório"),
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
  valor_total: z.number().min(0.01, "Valor deve ser maior que zero"),
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

  const form = useForm<EncomendaFormData>({
    resolver: zodResolver(encomendaSchema),
    defaultValues: {
      numero_encomenda: "",
      cliente_id: "",
      fornecedor_id: "",
      valor_total: 0,
      data_entrega: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, fornecedoresRes] = await Promise.all([
          supabase.from("clientes").select("id, nome"),
          supabase.from("fornecedores").select("id, nome")
        ]);

        if (clientesRes.data) setClientes(clientesRes.data);
        if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: EncomendaFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("encomendas")
        .insert([{
          numero_encomenda: data.numero_encomenda,
          cliente_id: data.cliente_id,
          fornecedor_id: data.fornecedor_id,
          valor_total: data.valor_total,
          data_entrega: data.data_entrega || null,
          observacoes: data.observacoes || null,
        }]);

      if (error) {
        throw error;
      }

      toast.success("Encomenda criada com sucesso!");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar encomenda:", error);
      toast.error("Erro ao criar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numero_encomenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Encomenda *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ENV-001" {...field} />
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
          name="valor_total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total (€) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
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
              <FormLabel>Data de Entrega</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? "Criando..." : "Criar Encomenda"}
        </Button>
      </form>
    </Form>
  );
}