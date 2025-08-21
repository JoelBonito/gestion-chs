import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [marcasExistentes, setMarcasExistentes] = useState<string[]>([]);
  const [tiposExistentes, setTiposExistentes] = useState<string[]>([]);
  const [tamanhosExistentes, setTamanhosExistentes] = useState<string[]>([]);

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
    carregarOpcoesExistentes();
  }, []);

  useEffect(() => {
    if (initialData) {
      // Aguarda um pouco para garantir que o form está pronto
      setTimeout(() => {
        form.reset({
          nome: initialData.nome || "",
          marca: initialData.marca || "",
          tipo: initialData.tipo || "",
          tamanho: initialData.tamanho || "",
          preco_custo: initialData.preco_custo ? initialData.preco_custo.toString() : "",
          preco_venda: initialData.preco_venda ? initialData.preco_venda.toString() : "",
        });
      }, 100);
    } else if (!isEditing) {
      // Limpa o formulário quando não é edição
      form.reset({
        nome: "",
        marca: "",
        tipo: "",
        tamanho: "",
        preco_custo: "",
        preco_venda: "",
      });
    }
  }, [form, initialData, isEditing]);

  const carregarOpcoesExistentes = async () => {
    try {
      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("marca, tipo, tamanho");

      if (error) throw error;

      if (produtos) {
        const marcasUnicas = [...new Set(produtos.map(p => p.marca))].filter(Boolean).sort();
        const tiposUnicos = [...new Set(produtos.map(p => p.tipo))].filter(Boolean).sort();
        const tamanhosUnicos = [...new Set(produtos.map(p => p.tamanho))].filter(Boolean).sort();

        setMarcasExistentes(marcasUnicas);
        setTiposExistentes(tiposUnicos);
        setTamanhosExistentes(tamanhosUnicos);
      }
    } catch (error) {
      console.error("Erro ao carregar opções existentes:", error);
    }
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData && initialData.id) {
        console.log("Editando produto:", initialData.id, data);
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
        console.log("Criando novo produto:", data);
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
              <FormLabel className="font-display text-primary-dark">Nome do Produto</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Camiseta Premium" 
                  className="input-elegant"
                  {...field} 
                />
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
              <FormLabel className="font-display text-primary-dark">Marca</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input 
                    placeholder="Digite uma nova marca ou selecione existente"
                    list="marcas-list"
                    className="input-elegant"
                    {...field}
                  />
                  <datalist id="marcas-list">
                    {marcasExistentes.map((marca) => (
                      <option key={marca} value={marca} />
                    ))}
                  </datalist>
                  {marcasExistentes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      💡 Marcas existentes: {marcasExistentes.slice(0, 3).join(", ")}
                      {marcasExistentes.length > 3 && ` e mais ${marcasExistentes.length - 3}`}
                    </div>
                  )}
                </div>
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
              <FormLabel className="font-display text-primary-dark">Tipo</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input 
                    placeholder="Digite um novo tipo ou selecione existente"
                    list="tipos-list"
                    className="input-elegant"
                    {...field}
                  />
                  <datalist id="tipos-list">
                    {tiposExistentes.map((tipo) => (
                      <option key={tipo} value={tipo} />
                    ))}
                  </datalist>
                  {tiposExistentes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      💡 Tipos existentes: {tiposExistentes.slice(0, 3).join(", ")}
                      {tiposExistentes.length > 3 && ` e mais ${tiposExistentes.length - 3}`}
                    </div>
                  )}
                </div>
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
              <FormLabel className="font-display text-primary-dark">Tamanho</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input 
                    placeholder="Digite um novo tamanho ou selecione existente"
                    list="tamanhos-list"
                    className="input-elegant"
                    {...field}
                  />
                  <datalist id="tamanhos-list">
                    {tamanhosExistentes.map((tamanho) => (
                      <option key={tamanho} value={tamanho} />
                    ))}
                  </datalist>
                  {tamanhosExistentes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      💡 Tamanhos existentes: {tamanhosExistentes.slice(0, 5).join(", ")}
                      {tamanhosExistentes.length > 5 && ` e mais ${tamanhosExistentes.length - 5}`}
                    </div>
                  )}
                </div>
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
              <FormLabel className="font-display text-primary-dark">Preço de Custo (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  className="input-elegant"
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
              <FormLabel className="font-display text-primary-dark">Preço de Venda (€)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  className="input-elegant"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button 
          type="submit" 
          className="w-full bg-gradient-primary hover:shadow-hover transition-elegant font-display font-medium" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar Alterações" : "Cadastrar Produto")}
        </Button>
      </form>
    </Form>
  );
}