
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ItemEncomenda {
  id?: string;
  produto_id: string;
  produto_nome?: string;
  quantidade: number;
  preco_custo: number;
  preco_venda: number;
  subtotal: number;
}

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  tamanho: string;
  preco_custo: number;
  preco_venda: number;
}

interface ItensEncomendaManagerProps {
  itens: ItemEncomenda[];
  onItensChange: (itens: ItemEncomenda[]) => void;
  onValorTotalChange: (valor: number) => void;
}

export function ItensEncomendaManager({ itens, onItensChange, onValorTotalChange }: ItensEncomendaManagerProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const { data } = await supabase
          .from("produtos")
          .select("*")
          .order("nome");
        
        if (data) setProdutos(data);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProdutos();
  }, []);

  useEffect(() => {
    const valorTotal = itens.reduce((total, item) => total + item.subtotal, 0);
    onValorTotalChange(valorTotal);
  }, [itens, onValorTotalChange]);

  const adicionarItem = () => {
    const novoItem: ItemEncomenda = {
      produto_id: "",
      quantidade: 1,
      preco_custo: 0,
      preco_venda: 0,
      subtotal: 0,
    };
    onItensChange([...itens, novoItem]);
  };

  const duplicarItem = (index: number) => {
    const itemOriginal = itens[index];
    const itemDuplicado: ItemEncomenda = {
      produto_id: itemOriginal.produto_id,
      produto_nome: itemOriginal.produto_nome,
      quantidade: itemOriginal.quantidade,
      preco_custo: itemOriginal.preco_custo,
      preco_venda: itemOriginal.preco_venda,
      subtotal: itemOriginal.subtotal,
    };
    onItensChange([...itens, itemDuplicado]);
  };

  const removerItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    onItensChange(novosItens);
  };

  const atualizarItem = (index: number, campo: keyof ItemEncomenda, valor: any) => {
    const novosItens = [...itens];
    const item = { ...novosItens[index] };
    
    if (campo === "produto_id") {
      const produto = produtos.find(p => p.id === valor);
      if (produto) {
        item.produto_id = valor;
        item.produto_nome = `${produto.nome} - ${produto.marca} - ${produto.tipo} - ${produto.tamanho}`;
        item.preco_custo = produto.preco_custo;
        item.preco_venda = produto.preco_venda;
      }
    } else if (campo === "quantidade") {
      item.quantidade = valor;
    } else if (campo === "preco_custo") {
      item.preco_custo = valor;
    } else if (campo === "preco_venda") {
      item.preco_venda = valor;
    }
    
    // Recalcular subtotal
    item.subtotal = item.quantidade * item.preco_venda;
    
    novosItens[index] = item;
    onItensChange(novosItens);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Itens da Encomenda
          <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {itens.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum item adicionado. Clique em "Adicionar Item" para começar.
          </p>
        ) : (
          itens.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Produto *</label>
                  <Select
                    value={item.produto_id}
                    onValueChange={(value) => atualizarItem(index, "produto_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} - {produto.marca} - {produto.tipo} - {produto.tamanho}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantidade *</label>
                  <Input
                    type="number"
                    value={item.quantidade || ""}
                    onChange={(e) => atualizarItem(index, "quantidade", parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Preço Custo (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.preco_custo}
                    onChange={(e) => atualizarItem(index, "preco_custo", parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Preço Venda (€) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.preco_venda}
                    onChange={(e) => atualizarItem(index, "preco_venda", parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Subtotal (€)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.subtotal.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => duplicarItem(index)}
                      title="Duplicar item"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removerItem(index)}
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
        
        {itens.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total:</p>
              <p className="text-lg font-semibold">
                €{itens.reduce((total, item) => total + item.subtotal, 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
