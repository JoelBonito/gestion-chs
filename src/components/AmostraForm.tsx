import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const amostraSchema = z.object({
  data: z.date(),
  referencia: z.string().min(1, "Referência é obrigatória"),
  cliente_id: z.string().optional(),
  projeto: z.string().optional(),
  tipo_produto: z.string().optional(),
  cor: z.string().optional(),
  textura: z.string().optional(),
  fragrancia: z.string().optional(),
  ingredientes_adicionais: z.string().optional(),
  quantidade_amostras: z.number().min(1, "Quantidade deve ser no mínimo 1"),
  data_envio: z.date().optional(),
  observacoes: z.string().optional(),
});

type AmostraFormData = z.infer<typeof amostraSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface AmostraFormProps {
  amostra?: {
    id: string;
    data: string;
    referencia: string;
    cliente_id?: string;
    projeto?: string;
    tipo_produto?: string;
    cor?: string;
    textura?: string;
    fragrancia?: string;
    ingredientes_adicionais?: string;
    quantidade_amostras: number;
    data_envio?: string;
    observacoes?: string;
  };
  onSuccess: () => void;
}

export function AmostraForm({ amostra, onSuccess }: AmostraFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<AmostraFormData>({
    resolver: zodResolver(amostraSchema),
    defaultValues: {
      data: amostra ? new Date(amostra.data) : new Date(),
      referencia: amostra?.referencia || "",
      cliente_id: amostra?.cliente_id || "",
      projeto: amostra?.projeto || "",
      tipo_produto: amostra?.tipo_produto || "",
      cor: amostra?.cor || "",
      textura: amostra?.textura || "",
      fragrancia: amostra?.fragrancia || "",
      ingredientes_adicionais: amostra?.ingredientes_adicionais || "",
      quantidade_amostras: amostra?.quantidade_amostras || 1,
      data_envio: amostra?.data_envio ? new Date(amostra.data_envio) : undefined,
      observacoes: amostra?.observacoes || "",
    },
  });

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nome")
          .eq("active", true)
          .order("nome");

        if (error) throw error;
        setClientes(data || []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    fetchClientes();
  }, []);

  const onSubmit = async (data: AmostraFormData) => {
    try {
      setLoading(true);

      const formattedData = {
        data: format(data.data, "yyyy-MM-dd"),
        referencia: data.referencia,
        cliente_id: data.cliente_id || null,
        projeto: data.projeto || null,
        tipo_produto: data.tipo_produto || null,
        cor: data.cor || null,
        textura: data.textura || null,
        fragrancia: data.fragrancia || null,
        ingredientes_adicionais: data.ingredientes_adicionais || null,
        quantidade_amostras: data.quantidade_amostras,
        data_envio: data.data_envio ? format(data.data_envio, "yyyy-MM-dd") : null,
        observacoes: data.observacoes || null,
      };

      if (amostra) {
        // Update existing amostra
        const { error } = await supabase
          .from("amostras")
          .update(formattedData)
          .eq("id", amostra.id);

        if (error) throw error;
        toast.success("Amostra atualizada com sucesso!");
      } else {
        // Create new amostra
        const { error } = await supabase
          .from("amostras")
          .insert([formattedData]);

        if (error) throw error;
        toast.success("Amostra criada com sucesso!");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar amostra:", error);
      toast.error("Erro ao salvar amostra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecionar data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referência</FormLabel>
                <FormControl>
                  <Input placeholder="Digite a referência" {...field} />
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
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente" />
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
            name="projeto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do projeto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_produto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Produto</FormLabel>
                <FormControl>
                  <Input placeholder="Tipo do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <Input placeholder="Cor do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="textura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Textura</FormLabel>
                <FormControl>
                  <Input placeholder="Textura do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fragrancia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fragrância</FormLabel>
                <FormControl>
                  <Input placeholder="Fragrância do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantidade_amostras"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de Amostras</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_envio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Envio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Selecionar data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ingredientes_adicionais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingredientes Adicionais</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os ingredientes adicionais"
                  className="resize-none"
                  {...field}
                />
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
                <Textarea
                  placeholder="Observações adicionais"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}