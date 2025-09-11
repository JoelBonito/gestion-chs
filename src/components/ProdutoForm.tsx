import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";
import { FornecedorFormDialog } from "@/components/FornecedorFormDialog";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";

interface Fornecedor {
  id: string;
  nome: string;
}

interface ProdutoFormData {
  nome: string;
  marca: string;
  tipo: string;
  peso?: number;
  preco_compra?: number;
  preco_venda?: number;
  fornecedor_id?: string;
  ativo: boolean;
}

interface ProdutoFormProps {
  onSuccess?: () => void;
  produto?: any;
  isEditing?: boolean;
}

// Tipos serão gerenciados dinamicamente

export const ProdutoForm = ({ onSuccess, produto, isEditing = false }: ProdutoFormProps) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [novoTipo, setNovoTipo] = useState("");
  const [mostrarNovoTipo, setMostrarNovoTipo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isCollaborator } = useIsCollaborator();

  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: produto?.nome || "",
    marca: produto?.marca || "",
    tipo: produto?.tipo || "",
    peso: produto?.size_weight || undefined,
    preco_compra: produto?.preco_custo || undefined,
    preco_venda: produto?.preco_venda || undefined,
    fornecedor_id: produto?.fornecedor_id || "",
    ativo: produto?.ativo ?? true
  });

  useEffect(() => {
    fetchFornecedores();
    fetchTipos();
  }, []);

  const handleInputChange = (field: keyof ProdutoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchFornecedores = async () => {
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
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive",
      });
    }
  };

  const fetchTipos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("tipo")
        .not("tipo", "is", null);

      if (error) throw error;
      
      // Extrair tipos únicos
      const tiposUnicos = [...new Set(data?.map(p => p.tipo) || [])].sort();
      setTipos(tiposUnicos);
    } catch (error) {
      console.error("Erro ao carregar tipos:", error);
    }
  };

  const handleAdicionarTipo = () => {
    if (novoTipo.trim() && !tipos.includes(novoTipo.trim())) {
      const tipoAtualizado = novoTipo.trim();
      setTipos([...tipos, tipoAtualizado].sort());
      setFormData(prev => ({ ...prev, tipo: tipoAtualizado }));
      setNovoTipo("");
      setMostrarNovoTipo(false);
    }
  };

  const handleFornecedorCriado = (novoFornecedor: { id: string; nome: string }) => {
    setFornecedores(prev => [...prev, novoFornecedor].sort((a, b) => a.nome.localeCompare(b.nome)));
    setFormData(prev => ({ ...prev, fornecedor_id: novoFornecedor.id }));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      marca: "",
      tipo: "",
      peso: undefined,
      preco_compra: undefined,
      preco_venda: undefined,
      fornecedor_id: "",
      ativo: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.marca || !formData.tipo) {
      toast({
        title: "Erro",
        description: "Nome, marca e tipo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let produto_id = produto?.id;

      if (isEditing) {
        const { data, error } = await supabase
          .from("produtos")
          .update({
            nome: formData.nome,
            marca: formData.marca,
            tipo: formData.tipo,
            preco_custo: formData.preco_compra || 0,
            preco_venda: formData.preco_venda || 0,
            size_weight: formData.peso || 0,
            fornecedor_id: formData.fornecedor_id,
            ativo: formData.ativo
          })
          .eq("id", produto.id)
          .select()
          .single();

        if (error) throw error;
        produto_id = data.id;
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        });
      } else {
        const { data, error } = await supabase
          .from("produtos")
          .insert([{
            nome: formData.nome,
            marca: formData.marca,
            tipo: formData.tipo,
            preco_custo: formData.preco_compra || 0,
            preco_venda: formData.preco_venda || 0,
            size_weight: formData.peso || 0,
            fornecedor_id: formData.fornecedor_id,
            ativo: formData.ativo
          }])
          .select()
          .single();

        if (error) throw error;
        produto_id = data.id;
        toast({
          title: "Sucesso",
          description: "Produto criado com sucesso!",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto p-4">
      {/* Informações do Produto */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Nome do produto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca *</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => handleInputChange("marca", e.target.value)}
              placeholder="Marca do produto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            {!mostrarNovoTipo ? (
              <div className="flex gap-2">
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => {
                    if (value === "novo") {
                      setMostrarNovoTipo(true);
                    } else {
                      handleInputChange("tipo", value);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                    <SelectItem value="novo">+ Novo Tipo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value)}
                  placeholder="Digite o novo tipo"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdicionarTipo();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleAdicionarTipo}
                  disabled={!novoTipo.trim()}
                >
                  Adicionar
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setMostrarNovoTipo(false);
                    setNovoTipo("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <div className="flex gap-2">
              <Select
                value={formData.fornecedor_id}
                onValueChange={(value) => handleInputChange("fornecedor_id", value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FornecedorFormDialog onFornecedorCreated={handleFornecedorCriado} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="peso">Peso (g)</Label>
            <Input
              id="peso"
              type="number"
              step="0.01"
              value={formData.peso || ""}
              onChange={(e) => handleInputChange("peso", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 250"
            />
          </div>

          <div className="space-y-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleInputChange("ativo", e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="ativo">Produto ativo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Preços */}
      <Card>
        <CardHeader>
          <CardTitle>Preços</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preco_compra">Preço de Compra (€) *</Label>
            <Input
              id="preco_compra"
              type="number"
              step="0.01"
              min="0"
              value={formData.preco_compra || ""}
              onChange={(e) => handleInputChange("preco_compra", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0,00"
              required
            />
          </div>

          {!isCollaborator && (
            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda (€) *</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_venda || ""}
                onChange={(e) => handleInputChange("preco_venda", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0,00"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          {produto?.id && (
            <AttachmentManager
              entityType="produto"
              entityId={produto.id}
              onChanged={() => {
                console.log("ProdutoForm - Attachment changed, triggering success callback");
                onSuccess?.();
              }}
            />
          )}
          {!produto?.id && (
            <p className="text-sm text-gray-500">
              Salve o produto primeiro para adicionar anexos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
    </div>
  );
};