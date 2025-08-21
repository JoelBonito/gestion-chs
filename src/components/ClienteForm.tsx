import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const clienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
}

interface ClienteFormProps {
  onSuccess?: () => void;
  initialData?: Cliente | null;
  isEditing?: boolean;
}

export function ClienteForm({ onSuccess, initialData, isEditing = false }: ClienteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        nome: initialData.nome,
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        endereco: initialData.endereco || "",
      });
    }
  }, [form, isEditing, initialData]);

  const onSubmit = async (data: ClienteFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
          })
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("clientes")
          .insert([{
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
          }]);

        if (error) throw error;
        toast.success("Cliente cadastrado com sucesso!");
      }

      if (!isEditing) form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Digite o email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="Digite o telefone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea placeholder="Digite o endereço completo" {...field} />
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
          {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar Alterações" : "Cadastrar Cliente")}
        </Button>
      </form>
    </Form>
  );
}