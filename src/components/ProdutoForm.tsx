import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
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
  const [novaOpçaoDialog, setNovaOpçaoDialog] = useState<{tipo: string, aberto: boolean}>({tipo: '', aberto: false});
  const [novoValor, setNovoValor] = useState('');

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
      form.reset({
        nome: initialData.nome || "",
        marca: initialData.marca || "",
        tipo: initialData.tipo || "",
        tamanho: initialData.tamanho || "",
        preco_custo: initialData.preco_custo ? initialData.preco_custo.toString() : "",
        preco_venda: initialData.preco_venda ? initialData.preco_venda.toString() : "",
      });
    } else if (!isEditing) {
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

  const handleNovaOpcao = (tipo: string) => {
    setNovaOpçaoDialog({tipo, aberto: true});
    setNovoValor('');
  };

  const adicionarNovaOpcao = () => {
    if (!novoValor.trim()) return;
    
    const campo = novaOpçaoDialog.tipo;
    const valor = novoValor.trim();
    
    // Adiciona à lista correspondente
    if (campo === 'marca') {
      setMarcasExistentes(prev => [...prev, valor].sort());
      form.setValue('marca', valor);
    } else if (campo === 'tipo') {
      setTiposExistentes(prev => [...prev, valor].sort());
      form.setValue('tipo', valor);
    } else if (campo === 'tamanho') {
      setTamanhosExistentes(prev => [...prev, valor].sort());
      form.setValue('tamanho', valor);
    }
    
    setNovaOpçaoDialog({tipo: '', aberto: false});
    setNovoValor('');
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
               <Select onValueChange={(value) => {
                 if (value === '__nova_marca__') {
                   handleNovaOpcao('marca');
                 } else {
                   field.onChange(value);
                 }
               }} value={field.value || ""} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="input-elegant">
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {marcasExistentes.map((marca) => (
                    <SelectItem key={marca} value={marca}>
                      {marca}
                    </SelectItem>
                  ))}
                  <SelectItem value="__nova_marca__" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar nova marca...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
               <Select onValueChange={(value) => {
                 if (value === '__novo_tipo__') {
                   handleNovaOpcao('tipo');
                 } else {
                   field.onChange(value);
                 }
               }} value={field.value || ""} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="input-elegant">
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposExistentes.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                  <SelectItem value="__novo_tipo__" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar novo tipo...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
               <Select onValueChange={(value) => {
                 if (value === '__novo_tamanho__') {
                   handleNovaOpcao('tamanho');
                 } else {
                   field.onChange(value);
                 }
               }} value={field.value || ""} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="input-elegant">
                    <SelectValue placeholder="Selecione um tamanho" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tamanhosExistentes.map((tamanho) => (
                    <SelectItem key={tamanho} value={tamanho}>
                      {tamanho}
                    </SelectItem>
                  ))}
                  <SelectItem value="__novo_tamanho__" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar novo tamanho...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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

      {/* Dialog para adicionar nova opção */}
      <Dialog open={novaOpçaoDialog.aberto} onOpenChange={(aberto) => setNovaOpçaoDialog({...novaOpçaoDialog, aberto})}>
        <DialogContent className="max-w-md shadow-elegant">
          <DialogHeader>
            <DialogTitle className="font-display text-primary-dark">
              Adicionar Nova {novaOpçaoDialog.tipo === 'marca' ? 'Marca' : novaOpçaoDialog.tipo === 'tipo' ? 'Tipo' : 'Tamanho'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-display text-primary-dark">
                {novaOpçaoDialog.tipo === 'marca' ? 'Nome da Marca' : novaOpçaoDialog.tipo === 'tipo' ? 'Nome do Tipo' : 'Tamanho'}
              </Label>
              <Input
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder={`Digite ${novaOpçaoDialog.tipo === 'marca' ? 'a nova marca' : novaOpçaoDialog.tipo === 'tipo' ? 'o novo tipo' : 'o novo tamanho'}`}
                className="input-elegant mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarNovaOpcao();
                  }
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setNovaOpçaoDialog({tipo: '', aberto: false})}
              >
                Cancelar
              </Button>
              <Button 
                onClick={adicionarNovaOpcao}
                className="bg-gradient-primary"
                disabled={!novoValor.trim()}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}