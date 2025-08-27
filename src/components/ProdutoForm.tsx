
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Save, X } from "lucide-react";

interface Fornecedor {
  id: string;
  nome: string;
}

interface ProdutoFormData {
  nome: string;
  marca: string;
  categoria: string;
  subcategoria: string;
  descricao?: string;
  codigo_barras?: string;
  peso?: number;
  dimensoes?: string;
  cor?: string;
  tamanho?: string;
  material?: string;
  origem?: string;
  ingredientes?: string;
  instrucoes_uso?: string;
  cuidados_especiais?: string;
  data_validade?: string;
  preco_compra?: number;
  preco_venda?: number;
  margem_lucro?: number;
  fornecedor_id?: string;
  estoque_minimo?: number;
  estoque_maximo?: number;
  unidade_medida: string;
  ativo: boolean;
}

interface Variacao {
  id?: string;
  nome: string;
  valor: string;
  estoque: number;
  preco_adicional: number;
}

interface ProdutoFormProps {
  onSuccess?: () => void;
  produto?: any;
  isEditing?: boolean;
}

const categorias = [
  "Cabelo",
  "Pele",
  "Unhas",
  "Maquiagem",
  "Perfumaria",
  "Corporal",
  "Facial",
  "Equipamentos",
  "Acessórios",
  "Outros"
];

const subcategorias: Record<string, string[]> = {
  "Cabelo": ["Shampoo", "Condicionador", "Máscara", "Leave-in", "Óleo", "Mousse", "Gel", "Spray", "Tintura", "Descolorante"],
  "Pele": ["Hidratante", "Protetor Solar", "Sérum", "Tônico", "Esfoliante", "Máscara Facial", "Água Micelar", "Demaquilante"],
  "Unhas": ["Esmalte", "Base", "Top Coat", "Removedor", "Fortalecedor", "Óleo Cutícula", "Lixa", "Alicate"],
  "Maquiagem": ["Base", "Corretivo", "Pó", "Blush", "Bronzer", "Sombra", "Delineador", "Rímel", "Batom", "Gloss"],
  "Perfumaria": ["Perfume", "Colônia", "Desodorante", "Spray Corporal", "Óleo Essencial"],
  "Corporal": ["Hidratante Corporal", "Sabonete", "Esfoliante Corporal", "Óleo Corporal", "Desodorante"],
  "Facial": ["Limpador Facial", "Hidratante Facial", "Sérum Facial", "Protetor Solar Facial", "Máscara Facial"],
  "Equipamentos": ["Secador", "Chapinha", "Modelador", "Escova", "Pente", "Alicate", "Tesoura"],
  "Acessórios": ["Presilha", "Elástico", "Tiara", "Lenço", "Bolsa", "Necessaire"],
  "Outros": ["Kit", "Conjunto", "Promocional", "Brinde", "Diversos"]
};

const unidadesMedida = [
  "UN - Unidade",
  "ML - Mililitro",
  "L - Litro",
  "G - Grama",
  "KG - Quilograma",
  "M - Metro",
  "CM - Centímetro",
  "PC - Peça",
  "CX - Caixa",
  "PCT - Pacote"
];

export function ProdutoForm({ onSuccess, produto, isEditing = false }: ProdutoFormProps) {
  const { toast: hookToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [showVariacoes, setShowVariacoes] = useState(false);
  
  const [formData, setFormData] = useState<ProdutoFormData>({
    nome: produto?.nome || "",
    marca: produto?.marca || "",
    categoria: produto?.categoria || "",
    subcategoria: produto?.subcategoria || "",
    descricao: produto?.descricao || "",
    codigo_barras: produto?.codigo_barras || "",
    peso: produto?.peso || undefined,
    dimensoes: produto?.dimensoes || "",
    cor: produto?.cor || "",
    tamanho: produto?.tamanho || "",
    material: produto?.material || "",
    origem: produto?.origem || "",
    ingredientes: produto?.ingredientes || "",
    instrucoes_uso: produto?.instrucoes_uso || "",
    cuidados_especiais: produto?.cuidados_especiais || "",
    data_validade: produto?.data_validade || "",
    preco_compra: produto?.preco_compra || undefined,
    preco_venda: produto?.preco_venda || undefined,
    margem_lucro: produto?.margem_lucro || undefined,
    fornecedor_id: produto?.fornecedor_id || "",
    estoque_minimo: produto?.estoque_minimo || undefined,
    estoque_maximo: produto?.estoque_maximo || undefined,
    unidade_medida: produto?.unidade_medida || "UN - Unidade",
    ativo: produto?.ativo ?? true
  });

  useEffect(() => {
    if (produto?.variacoes_produto) {
      setVariacoes(produto.variacoes_produto);
      setShowVariacoes(produto.variacoes_produto.length > 0);
    }
  }, [produto]);

  useEffect(() => {
    fetchFornecedores();
  }, []);

  useEffect(() => {
    if (formData.preco_compra && formData.preco_venda) {
      const margem = ((formData.preco_venda - formData.preco_compra) / formData.preco_compra) * 100;
      setFormData(prev => ({ ...prev, margem_lucro: Number(margem.toFixed(2)) }));
    }
  }, [formData.preco_compra, formData.preco_venda]);

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar fornecedores:", error);
      hookToast({
        title: "Erro ao carregar fornecedores",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: keyof ProdutoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const adicionarVariacao = () => {
    setVariacoes(prev => [...prev, {
      nome: "",
      valor: "",
      estoque: 0,
      preco_adicional: 0
    }]);
  };

  const removerVariacao = (index: number) => {
    setVariacoes(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariacaoChange = (index: number, field: keyof Variacao, value: any) => {
    setVariacoes(prev => prev.map((variacao, i) => 
      i === index ? { ...variacao, [field]: value } : variacao
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.categoria) {
      toast.error("Categoria é obrigatória");
      return;
    }

    if (!formData.unidade_medida) {
      toast.error("Unidade de medida é obrigatória");
      return;
    }

    setIsLoading(true);

    try {
      let produto_id = produto?.id;

      if (isEditing) {
        const { data, error } = await supabase
          .from("produtos")
          .update(formData)
          .eq("id", produto.id)
          .select()
          .single();

        if (error) throw error;
        produto_id = data.id;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { data, error } = await supabase
          .from("produtos")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        produto_id = data.id;
        toast.success("Produto criado com sucesso!");
      }

      // Gerenciar variações
      if (showVariacoes && variacoes.length > 0) {
        // Remove variações existentes se estiver editando
        if (isEditing) {
          await supabase
            .from("variacoes_produto")
            .delete()
            .eq("produto_id", produto_id);
        }

        // Inserir novas variações
        const variacoesParaInserir = variacoes
          .filter(v => v.nome.trim() && v.valor.trim())
          .map(v => ({
            produto_id,
            nome: v.nome,
            valor: v.valor,
            estoque: v.estoque || 0,
            preco_adicional: v.preco_adicional || 0
          }));

        if (variacoesParaInserir.length > 0) {
          const { error: variacoesError } = await supabase
            .from("variacoes_produto")
            .insert(variacoesParaInserir);

          if (variacoesError) throw variacoesError;
        }
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subcategoriaOptions = formData.categoria ? subcategorias[formData.categoria] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Ex: Shampoo Hidratante"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) => handleInputChange("marca", e.target.value)}
              placeholder="Ex: L'Oréal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategoria">Subcategoria</Label>
            <Select 
              value={formData.subcategoria} 
              onValueChange={(value) => handleInputChange("subcategoria", value)}
              disabled={!formData.categoria}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a subcategoria" />
              </SelectTrigger>
              <SelectContent>
                {subcategoriaOptions.map((subcategoria) => (
                  <SelectItem key={subcategoria} value={subcategoria}>
                    {subcategoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_barras">Código de Barras</Label>
            <Input
              id="codigo_barras"
              value={formData.codigo_barras}
              onChange={(e) => handleInputChange("codigo_barras", e.target.value)}
              placeholder="Ex: 7891234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade_medida">Unidade de Medida *</Label>
            <Select value={formData.unidade_medida} onValueChange={(value) => handleInputChange("unidade_medida", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidadesMedida.map((unidade) => (
                  <SelectItem key={unidade} value={unidade}>
                    {unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Descrição detalhada do produto"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Características Físicas */}
      <Card>
        <CardHeader>
          <CardTitle>Características Físicas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="dimensoes">Dimensões</Label>
            <Input
              id="dimensoes"
              value={formData.dimensoes}
              onChange={(e) => handleInputChange("dimensoes", e.target.value)}
              placeholder="Ex: 15x10x5 cm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor">Cor</Label>
            <Input
              id="cor"
              value={formData.cor}
              onChange={(e) => handleInputChange("cor", e.target.value)}
              placeholder="Ex: Azul"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tamanho">Tamanho</Label>
            <Input
              id="tamanho"
              value={formData.tamanho}
              onChange={(e) => handleInputChange("tamanho", e.target.value)}
              placeholder="Ex: P, M, G"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={formData.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
              placeholder="Ex: Plástico, Metal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Input
              id="origem"
              value={formData.origem}
              onChange={(e) => handleInputChange("origem", e.target.value)}
              placeholder="Ex: Brasil, Importado"
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Específicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Específicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredientes">Ingredientes</Label>
            <Textarea
              id="ingredientes"
              value={formData.ingredientes}
              onChange={(e) => handleInputChange("ingredientes", e.target.value)}
              placeholder="Lista de ingredientes"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucoes_uso">Instruções de Uso</Label>
            <Textarea
              id="instrucoes_uso"
              value={formData.instrucoes_uso}
              onChange={(e) => handleInputChange("instrucoes_uso", e.target.value)}
              placeholder="Como usar o produto"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuidados_especiais">Cuidados Especiais</Label>
            <Textarea
              id="cuidados_especiais"
              value={formData.cuidados_especiais}
              onChange={(e) => handleInputChange("cuidados_especiais", e.target.value)}
              placeholder="Cuidados especiais e contraindicações"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_validade">Data de Validade</Label>
            <Input
              id="data_validade"
              type="date"
              value={formData.data_validade}
              onChange={(e) => handleInputChange("data_validade", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Comerciais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Comerciais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preco_compra">Preço de Compra (€)</Label>
            <Input
              id="preco_compra"
              type="number"
              step="0.01"
              value={formData.preco_compra || ""}
              onChange={(e) => handleInputChange("preco_compra", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco_venda">Preço de Venda (€)</Label>
            <Input
              id="preco_venda"
              type="number"
              step="0.01"
              value={formData.preco_venda || ""}
              onChange={(e) => handleInputChange("preco_venda", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="margem_lucro">Margem de Lucro (%)</Label>
            <Input
              id="margem_lucro"
              type="number"
              step="0.01"
              value={formData.margem_lucro || ""}
              onChange={(e) => handleInputChange("margem_lucro", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor_id">Fornecedor Principal</Label>
            <Select value={formData.fornecedor_id} onValueChange={(value) => handleInputChange("fornecedor_id", value)}>
              <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
            <Input
              id="estoque_minimo"
              type="number"
              value={formData.estoque_minimo || ""}
              onChange={(e) => handleInputChange("estoque_minimo", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
            <Input
              id="estoque_maximo"
              type="number"
              value={formData.estoque_maximo || ""}
              onChange={(e) => handleInputChange("estoque_maximo", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Variações do Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Variações do Produto
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowVariacoes(!showVariacoes)}
            >
              {showVariacoes ? "Ocultar" : "Adicionar"} Variações
            </Button>
          </CardTitle>
        </CardHeader>
        {showVariacoes && (
          <CardContent className="space-y-4">
            {variacoes.map((variacao, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Nome da Variação</Label>
                  <Input
                    value={variacao.nome}
                    onChange={(e) => handleVariacaoChange(index, "nome", e.target.value)}
                    placeholder="Ex: Tamanho, Cor"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    value={variacao.valor}
                    onChange={(e) => handleVariacaoChange(index, "valor", e.target.value)}
                    placeholder="Ex: 250ml, Azul"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Estoque</Label>
                  <Input
                    type="number"
                    value={variacao.estoque}
                    onChange={(e) => handleVariacaoChange(index, "estoque", parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preço Adicional (€)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={variacao.preco_adicional}
                      onChange={(e) => handleVariacaoChange(index, "preco_adicional", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removerVariacao(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={adicionarVariacao}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Variação
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Anexos - Only show for existing products */}
      {isEditing && produto?.id && (
        <Card>
          <CardHeader>
            <CardTitle>Anexos do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentManager
              entityType="produto"
              entityId={produto.id}
              title="Anexos do Produto"
              onChanged={() => {
                // Refresh parent component if needed
                console.log("Attachment changed for product:", produto.id);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : isEditing ? "Atualizar Produto" : "Criar Produto"}
        </Button>
      </div>
    </form>
  );
}
