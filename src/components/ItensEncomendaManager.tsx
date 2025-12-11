import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Box, Package, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export interface ItemEncomenda {
  id?: string;
  tempId?: string; // ID temporário para React keys - evita re-render ao editar
  produto_id: string;
  produto_nome?: string;
  quantidade: number; // Always integer - no decimals allowed
  preco_custo: number;
  preco_venda: number; // Este será mapeado para preco_unitario no banco
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
    // Calcular valor total de todos os itens
    const valorTotal = itens.reduce((total, item) => total + (item.subtotal || 0), 0);
    onValorTotalChange(valorTotal);
  }, [itens, onValorTotalChange]);

  const adicionarItem = () => {
    const novoItem: ItemEncomenda = {
      tempId: crypto.randomUUID(), // ID temporário único para React key
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
      item.quantidade = Math.floor(valor); // Ensure integer
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

  // Verificar se é item de frete
  const isFreteItem = (item: ItemEncomenda) => {
    return item.produto_id === "00000000-0000-0000-0000-000000000001";
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Itens da Encomenda</h3>
        </div>
        {!isTransportMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarItem}
            className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center font-medium">
              Nenhum item adicionado.
            </p>
            {!isTransportMode && <p className="text-sm opacity-70">Clique em "Adicionar Item" para começar.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {itens.map((item, index) => {
              // Usar tempId ou id como key estável para evitar re-render ao editar
              const itemKey = item.tempId || item.id || `fallback-${index}`;
              const isFrete = isFreteItem(item);

              return (
                <div
                  key={itemKey}
                  className={`p-5 rounded-xl border transition-all duration-300 ${isFrete
                    ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
                    : 'bg-background/40 hover:bg-background/60 border-border/40 hover:border-border/60 shadow-sm'
                    }`}
                >
                  <div className="space-y-4">
                    {isFrete ? (
                      // Layout especial para item de frete (Simplificado)
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                          <label className="text-xs font-semibold mb-1.5 block text-blue-700 dark:text-blue-300 uppercase tracking-wide">Descrição</label>
                          <div className="h-10 px-3 py-2 bg-blue-100/50 dark:bg-blue-900/40 rounded-md border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 text-sm font-medium flex items-center">
                            FRETE (SP - MRS)
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-blue-700 dark:text-blue-300 uppercase tracking-wide">Peso Total (kg)</label>
                          <Input
                            type="number"
                            step="0.001"
                            value={item.quantidade || ""}
                            onChange={(e) => atualizarItem(index, "quantidade", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="bg-background/80 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-blue-700 dark:text-blue-300 uppercase tracking-wide">Preço/kg (€)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.preco_venda || ""}
                            onChange={(e) => atualizarItem(index, "preco_venda", parseFloat(e.target.value) || 0)}
                            placeholder="4.50"
                            className="bg-background/80 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Frete</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-10 px-3 py-2 bg-blue-100/50 dark:bg-blue-900/40 rounded-md border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 text-sm font-bold flex items-center justify-end">
                              {formatCurrencyEUR(item.subtotal || 0)}
                            </div>
                            {isTransportMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => removerItem(index)}
                                title="Remover frete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Layout normal para produtos
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr,120px] gap-4">
                          <div>
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Produto *</label>
                            <Select
                              value={item.produto_id}
                              onValueChange={(value) => atualizarItem(index, "produto_id", value)}
                              disabled={isTransportMode}
                            >
                              <SelectTrigger className="bg-background/50 h-10">
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
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Qtd. *</label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={item.quantidade || ""}
                              onChange={(e) => atualizarItem(index, "quantidade", parseInt(e.target.value) || 1)}
                              placeholder="0"
                              disabled={!isTransportMode && item.produto_id === ""}
                              className="bg-background/50 h-10"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Peso Un.</label>
                            <div className="h-10 px-3 py-2 bg-muted/50 rounded-md border border-border/50 text-muted-foreground text-sm flex items-center">
                              {item.peso_produto ? `${item.peso_produto}g` : "0g"}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Custo (€)</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.preco_custo !== undefined ? item.preco_custo : ""}
                              onChange={(e) => atualizarItem(index, "preco_custo", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="bg-background/50 h-10"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Venda (€) *</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.preco_venda !== undefined ? item.preco_venda : ""}
                              onChange={(e) => atualizarItem(index, "preco_venda", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              disabled={!isTransportMode && item.produto_id === ""}
                              className="bg-background/50 h-10 border-primary/20 focus:border-primary/50"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Subtotal</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-10 px-3 py-2 bg-primary/5 rounded-md border border-primary/10 text-primary font-bold text-sm flex items-center justify-end">
                                {formatCurrencyEUR(item.subtotal || 0)}
                              </div>
                              {!isTransportMode && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 text-muted-foreground hover:text-red-500 transition-colors"
                                  onClick={() => removerItem(index)}
                                  title="Remover item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
