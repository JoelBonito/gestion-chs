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

const fornecedorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  contato: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  contato?: string;
}

interface FornecedorFormProps {
  onSuccess?: () => void;
  initialData?: Fornecedor | null;
  isEditing?: boolean;
}

export function FornecedorForm({ onSuccess, initialData, isEditing = false }: FornecedorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
      contato: "",
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        nome: initialData.nome,
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        endereco: initialData.endereco || "",
        contato: initialData.contato || "",
      });
    }
  }, [form, isEditing, initialData]);

  const onSubmit = async (data: FornecedorFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        const { error } = await supabase
          .from("fornecedores")
          .update({
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
            contato: data.contato || null,
          })
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("fornecedores")
          .insert([{
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
            contato: data.contato || null,
          }]);

        if (error) throw error;
        toast.success("Fornecedor cadastrado com sucesso!");
      }

      if (!isEditing) form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar fornecedor");
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
                <Input placeholder="Digite o nome do fornecedor" {...field} />
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
          name="contato"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pessoa de Contato</FormLabel>
              <FormControl>
                <Input placeholder="Nome da pessoa de contato" {...field} />
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
          {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor")}
        </Button>
      </form>
    </Form>
  );
}