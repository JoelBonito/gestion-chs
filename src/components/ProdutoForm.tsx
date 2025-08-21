import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/utils/activityLogger";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  marca: z.string().min(1, "Marca é obrigatória"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  preco_custo: z.string().min(1, "Preço de custo é obrigatório"),
  preco_venda: z.string().min(1, "Preço de venda é obrigatório"),
  fornecedor_id: z.string().min(1, "Fornecedor é obrigatório"),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  tamanho_ml: number;
  peso_gramas: number;
  preco_custo: number;
  preco_venda: number;
  fornecedor_id: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface ProdutoFormProps {
  onSuccess?: () => void;
  initialData?: Produto | null;
  isEditing?: boolean;
}

export function ProdutoForm({ onSuccess, initialData, isEditing = false }: ProdutoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [marcasExistentes, setMarcasExistentes] = useState<string[]>([]);
  const [tiposExistentes, setTiposExistentes] = useState<string[]>([]);
  const [novaOpçaoDialog, setNovaOpçaoDialog] = useState<{tipo: string, aberto: boolean}>({tipo: '', aberto: false});
  const [novoValor, setNovoValor] = useState('');

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      marca: "",
      tipo: "",
      preco_custo: "",
      preco_venda: "",
      fornecedor_id: "",
    },
  });

  useEffect(() => {
    carregarFornecedores();
    carregarOpcoesExistentes();
  }, []);

  useEffect(() => {
    if (initialData) {
      const formData = {
        nome: initialData.nome || "",
        marca: initialData.marca || "",
        tipo: initialData.tipo || "",
        preco_custo: initialData.preco_custo ? initialData.preco_custo.toString() : "",
        preco_venda: initialData.preco_venda ? initialData.preco_venda.toString() : "",
        fornecedor_id: initialData.fornecedor_id || "",
      };
      
      setTimeout(() => {
        form.reset(formData);
      }, 200);
    } else {
      form.reset({
        nome: "",
        marca: "",
        tipo: "",
        preco_custo: "",
        preco_venda: "",
        fornecedor_id: "",
      });
    }
  }, [form, initialData]);

  const carregarFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("active", true)
        .order("nome");

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    }
  };

  const carregarOpcoesExistentes = async () => {
    try {
      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("marca, tipo")
        .eq("ativo", true);

      if (error) {
        console.error("Erro ao carregar opções existentes:", error);
        return;
      }

      if (produtos) {
        const marcasUnicas = [...new Set(produtos.map(p => p.marca))].filter(Boolean).sort();
        const tiposUnicos = [...new Set(produtos.map(p => p.tipo))].filter(Boolean).sort();

        setMarcasExistentes(marcasUnicas);
        setTiposExistentes(tiposUnicos);
      }
    } catch (error) {
      console.error("Erro ao carregar opções existentes:", error);
    }
  };

  const handleNovaOpcao = (tipo: string) => {
    setNovaOpçaoDialog({tipo, aberto: true});
    setNovoValor('');
  };

  const adicionarNovaOpcao = async () => {
    if (!novoValor.trim()) return;
    
    const campo = novaOpçaoDialog.tipo;
    const valor = novoValor.trim();
    
    if (campo === 'marca') {
      setMarcasExistentes(prev => [...prev, valor].sort());
      form.setValue('marca', valor);
    } else if (campo === 'tipo') {
      setTiposExistentes(prev => [...prev, valor].sort());
      form.setValue('tipo', valor);
    } else if (campo === 'fornecedor') {
      try {
        const { data: novoFornecedor, error } = await supabase
          .from("fornecedores")
          .insert([{
            nome: valor,
            active: true
          }])
          .select()
          .single();

        if (error) throw error;

        setFornecedores(prev => [...prev, novoFornecedor].sort((a, b) => a.nome.localeCompare(b.nome)));
        form.setValue('fornecedor_id', novoFornecedor.id);
        toast.success("Fornecedor adicionado com sucesso!");
      } catch (error) {
        console.error("Erro ao adicionar fornecedor:", error);
        toast.error("Erro ao adicionar fornecedor");
        return;
      }
    }
    
    setNovaOpçaoDialog({tipo: '', aberto: false});
    setNovoValor('');
  };

  const onSubmit = async (data: ProdutoFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData && initialData.id) {
        const { error } = await supabase
          .from("produtos")
          .update({
            nome: data.nome,
            marca: data.marca,
            tipo: data.tipo,
            preco_custo: parseFloat(data.preco_custo),
            preco_venda: parseFloat(data.preco_venda),
            fornecedor_id: data.fornecedor_id,
          })
          .eq("id", initialData.id);

        if (error) throw error;
        
        await logActivity({
          entity: 'produto',
          entity_id: initialData.id,
          action: 'update',
          details: { nome: data.nome }
        });
        
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { data: produto, error } = await supabase
          .from("produtos")
          .insert({
            nome: data.nome,
            marca: data.marca,
            tipo: data.tipo,
            preco_custo: parseFloat(data.preco_custo),
            preco_venda: parseFloat(data.preco_venda),
            fornecedor_id: data.fornecedor_id,
          })
          .select()
          .single();

        if (error) throw error;
        
        await logActivity({
          entity: 'produto',
          entity_id: produto.id,
          action: 'create',
          details: { nome: data.nome }
        });
        
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
                  placeholder="Ex: Shampoo Premium" 
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
          name="fornecedor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-display text-primary-dark">Fornecedor *</FormLabel>
              <Select onValueChange={(value) => {
                if (value === '__novo_fornecedor__') {
                  handleNovaOpcao('fornecedor');
                } else {
                  field.onChange(value);
                }
              }} value={field.value}>
                <FormControl>
                  <SelectTrigger className="input-elegant">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                  <SelectItem value="__novo_fornecedor__" className="text-primary font-medium">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar novo fornecedor...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                 }} value={field.value || ""}>
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
                 }} value={field.value || ""}>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-primary hover:shadow-hover transition-elegant font-display font-medium" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar Alterações" : "Cadastrar Produto")}
        </Button>
      </form>

      <Dialog open={novaOpçaoDialog.aberto} onOpenChange={(aberto) => setNovaOpçaoDialog({...novaOpçaoDialog, aberto})}>
        <DialogContent className="max-w-md shadow-elegant">
          <DialogHeader>
            <DialogTitle className="font-display text-primary-dark">
              Adicionar {novaOpçaoDialog.tipo === 'marca' ? 'Nova Marca' : 
                         novaOpçaoDialog.tipo === 'tipo' ? 'Novo Tipo' : 
                         'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-display text-primary-dark">
                {novaOpçaoDialog.tipo === 'marca' ? 'Nome da Marca' : 
                 novaOpçaoDialog.tipo === 'tipo' ? 'Nome do Tipo' : 
                 'Nome do Fornecedor'}
              </label>
              <Input
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder={novaOpçaoDialog.tipo === 'marca' ? 'Digite a nova marca' : 
                           novaOpçaoDialog.tipo === 'tipo' ? 'Digite o novo tipo' : 
                           'Digite o nome do fornecedor'}
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
