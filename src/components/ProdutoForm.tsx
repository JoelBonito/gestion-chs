import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  marca: z.string().min(1, "Marca é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  tamanho: z.string().min(1, "Tamanho é obrigatório"),
  preco_custo: z.string().min(1, "Preço de custo é obrigatório"),
  preco_venda: z.string().min(1, "Preço de venda é obrigatório"),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  tamanho: string;
  preco_custo: number;
  preco_venda: number;
}

interface ProdutoFormProps {
  onSuccess?: () => void;
  initialData?: Produto | null;
  isEditing?: boolean;
}

export function ProdutoForm({ onSuccess, initialData, isEditing = false }: ProdutoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      marca: "",
      tipo: "",
      tamanho: "",
      preco_custo: "",
      preco_venda: "",
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        nome: initialData.nome,
        marca: initialData.marca,
        tipo: initialData.tipo,
        tamanho: initialData.tamanho,
        preco_custo: initialData.preco_custo.toString(),
        preco_venda: initialData.preco_venda.toString(),
      });
    }
  }, [form, isEditing, initialData]);

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        const { error } = await supabase
          .from("produtos")
          .update({
            nome: data.nome,
            marca: data.marca,
            tipo: data.tipo,
            tamanho: data.tamanho,
            preco_custo: parseFloat(data.preco_custo),
            preco_venda: parseFloat(data.preco_venda),
          })
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("produtos").insert([
          {
            nome: data.nome,
            marca: data.marca,
            tipo: data.tipo,
            tamanho: data.tamanho,
            preco_custo: parseFloat(data.preco_custo),
            preco_venda: parseFloat(data.preco_venda),
          },
        ]);

        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }

      if (!isEditing) form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto");
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
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Camiseta Premium" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="marca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Nike" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Vestuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tamanho"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tamanho</FormLabel>
              <FormControl>
                <Input placeholder="Ex: M, G, GG" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preco_custo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço de Custo (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preco_venda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço de Venda (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar Alterações" : "Cadastrar Produto")}
        </Button>
      </form>
    </Form>
  );
}