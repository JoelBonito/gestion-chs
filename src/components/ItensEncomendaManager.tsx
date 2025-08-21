
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ItemEncomenda {
  id?: string;
  produto_id: string;
  produto_nome?: string;
  quantidade: number;
  preco_custo: number;
  preco_venda: number;
  subtotal: number;
  peso_produto?: number;
}

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_custo: number;
  preco_venda: number;
  size_weight: number;
}

interface ItensEncomendaManagerProps {
  itens: ItemEncomenda[];
  onItensChange: (itens: ItemEncomenda[]) => void;
  onValorTotalChange: (valor: number) => void;
  isTransportMode?: boolean;
}

export function ItensEncomendaManager({ 
  itens, 
  onItensChange, 
  onValorTotalChange, 
  isTransportMode = false 
}: ItensEncomendaManagerProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const { data, error } = await supabase
          .from("produtos")
          .select("id, nome, marca, tipo, preco_custo, preco_venda, size_weight")
          .eq("ativo", true)
          .order("nome");
        
        if (error) {
          console.error("Erro ao carregar produtos:", error);
          return;
        }

        if (data) {
          setProdutos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProdutos();
  }, []);

  useEffect(() => {
    // Calcular valor total apenas dos itens com subtotal > 0 para exibição
    // Mas manter todos os itens na lista, incluindo os com preço 0
    const valorTotal = itens.reduce((total, item) => total + (item.subtotal || 0), 0);
    onValorTotalChange(valorTotal);
  }, [itens, onValorTotalChange]);

  const adicionarItem = () => {
    const novoItem: ItemEncomenda = {
      produto_id: "",
      quantidade: 1,
      preco_custo: 0,
      preco_venda: 0,
      subtotal: 0,
      peso_produto: 0,
    };
    // Adicionar novo item no início da lista (topo)
    onItensChange([novoItem, ...itens]);
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
        item.produto_nome = `${produto.nome} - ${produto.marca} - ${produto.tipo}`;
        item.preco_custo = produto.preco_custo;
        item.preco_venda = produto.preco_venda;
        item.peso_produto = produto.size_weight;
      }
    } else if (campo === "quantidade") {
      item.quantidade = valor;
    } else if (campo === "preco_custo") {
      item.preco_custo = valor;
    } else if (campo === "preco_venda") {
      item.preco_venda = valor;
    }
    
    // Recalcular subtotal (permitir 0)
    item.subtotal = item.quantidade * item.preco_venda;
    
    novosItens[index] = item;
    onItensChange(novosItens);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Itens da Encomenda
          {!isTransportMode && (
            <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {itens.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum item adicionado. {!isTransportMode && 'Clique em "Adicionar Item" para começar.'}
          </p>
        ) : (
          <div className="space-y-4">
            {itens.map((item, index) => (
              <Card key={index} className="p-4 bg-muted/30">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Produto *</label>
                      <Select
                        value={item.produto_id}
                        onValueChange={(value) => atualizarItem(index, "produto_id", value)}
                        disabled={isTransportMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} - {produto.marca} - {produto.tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quantidade *</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade || ""}
                        onChange={(e) => atualizarItem(index, "quantidade", parseInt(e.target.value) || 1)}
                        placeholder="0"
                        disabled={!isTransportMode && item.produto_id === ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Peso Unitário</label>
                      <Input
                        type="text"
                        value={item.peso_produto ? `${item.peso_produto}g` : "0g"}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preço Custo (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.preco_custo || ""}
                        onChange={(e) => atualizarItem(index, "preco_custo", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        disabled={isTransportMode}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Preço Venda (€) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.preco_venda || ""}
                        onChange={(e) => atualizarItem(index, "preco_venda", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        disabled={!isTransportMode && item.produto_id === ""}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subtotal (€)</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={`€${(item.subtotal || 0).toFixed(2)}`}
                          readOnly
                          className="bg-muted font-semibold"
                        />
                        {!isTransportMode && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removerItem(index)}
                            title="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {itens.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total:</p>
              <p className="text-2xl font-bold text-primary">
                €{itens.reduce((total, item) => total + (item.subtotal || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
