import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Box, Package, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export interface ItemEncomenda {
  id?: string;
  tempId?: string;
  produto_id: string;
  produto_nome?: string;
  quantidade: string;
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

// Componente de Input isolado que gerencia estado local
// Só propaga mudanças para o pai no onBlur ou após timeout
interface LocalInputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  debounce?: boolean; // Novo prop para controlar debounce
}

const LocalInput = memo(({ value, onChange, type = "text", step, min, placeholder, disabled, className, id, debounce = false }: LocalInputProps) => {
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef(false);

  // Sincronizar com valor externo apenas quando NÃO está focado
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(String(value ?? ""));
    }
  }, [value]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounce) {
      // Debounce: só propaga após 500ms sem digitar
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    // Propaga imediatamente ao perder foco
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onChange(localValue);
  };

  return (
    <Input
      id={id}
      type={type}
      step={step}
      min={min}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
});

LocalInput.displayName = "LocalInput";

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

  // Usar ref para callback para evitar re-render
  const onValorTotalChangeRef = useRef(onValorTotalChange);
  onValorTotalChangeRef.current = onValorTotalChange;

  // Ref para armazenar o último valor total calculado
  const lastValorTotalRef = useRef(0);

  useEffect(() => {
    const valorTotal = itens.reduce((total, item) => total + (item.subtotal || 0), 0);

    if (valorTotal !== lastValorTotalRef.current) {
      lastValorTotalRef.current = valorTotal;
      onValorTotalChangeRef.current(valorTotal);
    }
  }, [itens]);

  const adicionarItem = () => {
    const novoItem: ItemEncomenda = {
      tempId: crypto.randomUUID(),
      produto_id: "",
      quantidade: "",
      preco_custo: 0,
      preco_venda: 0,
      subtotal: 0,
      peso_produto: 0,
    };
    onItensChange([novoItem, ...itens]);
  };

  const removerItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    onItensChange(novosItens);
  };

  const atualizarItem = useCallback((index: number, campo: keyof ItemEncomenda, valor: any) => {
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
      } else {
        item.produto_id = "";
        item.produto_nome = undefined;
        item.preco_custo = 0;
        item.preco_venda = 0;
        item.peso_produto = 0;
      }
    } else if (campo === "quantidade") {
      const cleaned = String(valor).replace(/[^0-9]/g, "");
      item.quantidade = cleaned;
    } else if (campo === "preco_custo") {
      item.preco_custo = Math.max(0, Number(valor));
    } else if (campo === "preco_venda") {
      item.preco_venda = Math.max(0, Number(valor));
    }

    const qty = parseInt(item.quantidade) || 0;
    item.subtotal = qty * item.preco_venda;

    novosItens[index] = item;
    onItensChange(novosItens);
  }, [itens, produtos, onItensChange]);

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
              const itemKey = item.tempId || item.id || `fallback-${index}`;
              const isFrete = isFreteItem(item);

              return (
                <div
                  key={itemKey}
                  className={`p-5 rounded-xl border transition-all duration-300 ${isFrete
                    ? 'bg-info/10 border-info/20 dark:bg-info/5 dark:border-info/10'
                    : 'bg-background/40 hover:bg-background/60 border-border/40 hover:border-border/60 shadow-sm'
                    }`}
                >
                  <div className="space-y-4">
                    {isFrete ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                          <label className="text-xs font-semibold mb-1.5 block text-info dark:text-info uppercase tracking-wide">Descrição</label>
                          <div className="h-10 px-3 py-2 bg-info/10 dark:bg-info/5 rounded-md border border-info/20 dark:border-info/10 text-info font-medium flex items-center">
                            FRETE (SP - MRS)
                          </div>
                        </div>

                        <div>
                          <label htmlFor={`peso-${itemKey}`} className="text-xs font-semibold mb-1.5 block text-info dark:text-info uppercase tracking-wide">Peso Total (kg)</label>
                          <LocalInput
                            id={`peso-${itemKey}`}
                            type="number"
                            step="0.001"
                            value={item.quantidade}
                            onChange={(val) => atualizarItem(index, "quantidade", val)}
                            placeholder="0"
                            className="bg-background/80 border-info/20 focus:border-info focus:ring-info/20"
                          />
                        </div>

                        <div>
                          <label htmlFor={`preco-kg-${itemKey}`} className="text-xs font-semibold mb-1.5 block text-info dark:text-info uppercase tracking-wide">Preço/kg (€)</label>
                          <LocalInput
                            id={`preco-kg-${itemKey}`}
                            type="number"
                            step="0.01"
                            value={item.preco_venda || ""}
                            onChange={(val) => atualizarItem(index, "preco_venda", parseFloat(val) || 0)}
                            placeholder="4.50"
                            className="bg-background/80 border-info/20 focus:border-info focus:ring-info/20"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold mb-1.5 block text-info dark:text-info uppercase tracking-wide">Total Frete</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-10 px-3 py-2 bg-info/10 dark:bg-info/5 rounded-md border border-info/20 dark:border-info/10 text-info font-bold flex items-center justify-end">
                              {formatCurrencyEUR(item.subtotal || 0)}
                            </div>
                            {isTransportMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr,120px] gap-4">
                          <div>
                            <label htmlFor={`produto-${itemKey}`} className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Produto *</label>
                            <Select
                              value={item.produto_id}
                              onValueChange={(value) => atualizarItem(index, "produto_id", value)}
                              disabled={isTransportMode}
                            >
                              <SelectTrigger id={`produto-${itemKey}`} className="bg-background/50 h-10">
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
                            <label htmlFor={`qtd-${itemKey}`} className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Qtd. *</label>
                            <LocalInput
                              id={`qtd-${itemKey}`}
                              type="number"
                              step="1"
                              min="0"
                              value={item.quantidade}
                              onChange={(val) => atualizarItem(index, "quantidade", val)}
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
                            <label htmlFor={`custo-${itemKey}`} className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Custo (€)</label>
                            <LocalInput
                              id={`custo-${itemKey}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.preco_custo || ""}
                              onChange={(val) => atualizarItem(index, "preco_custo", parseFloat(val) || 0)}
                              placeholder="0.00"
                              disabled={isTransportMode}
                              className="bg-background/50 h-10"
                            />
                          </div>

                          <div>
                            <label htmlFor={`venda-${itemKey}`} className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Venda (€)</label>
                            <LocalInput
                              id={`venda-${itemKey}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.preco_venda || ""}
                              onChange={(val) => atualizarItem(index, "preco_venda", parseFloat(val) || 0)}
                              placeholder="0.00"
                              disabled={isTransportMode}
                              className="bg-background/50 h-10"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold mb-1.5 block text-muted-foreground uppercase tracking-wide">Subtotal</label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-10 px-3 py-2 bg-primary/5 rounded-md border border-primary/20 text-primary font-semibold text-sm flex items-center">
                                <Euro className="h-3.5 w-3.5 mr-1 opacity-70" />
                                {formatCurrencyEUR(item.subtotal || 0)}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => removerItem(index)}
                                title="Remover item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

        {itens.length > 0 && (
          <div className="flex justify-end pt-4 border-t border-border/40">
            <div className="bg-primary/10 px-6 py-3 rounded-xl border border-primary/20">
              <span className="text-sm text-muted-foreground mr-2">Valor Total:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrencyEUR(itens.reduce((total, item) => total + (item.subtotal || 0), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default ItensEncomendaManager;
