import { useState, useEffect, useRef, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Box, Package, Euro, Save, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  onCancel?: () => void;
  isSubmitting?: boolean;
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
  debounce?: boolean;
  inputMode?: "numeric" | "decimal" | "text";
}

const LocalInput = memo(({ value, onChange, type = "text", step, min, placeholder, disabled, className, id, debounce = false, inputMode }: LocalInputProps) => {
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef(false);

  // Sincronizar com valor externo apenas quando NÃO está focado
  useEffect(() => {
    if (!isFocusedRef.current) {
      if (inputMode === "decimal" && value !== undefined && value !== null && value !== "") {
        const val = Number(value);
        setLocalValue(val.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      } else {
        setLocalValue(String(value ?? ""));
      }
    }
  }, [value, inputMode]);

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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    let finalValue = localValue;
    if (inputMode === "decimal" && localValue) {
      // Normalizar para o pai (trocar , por . para o Number)
      const normalized = localValue.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) {
        setLocalValue(num.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        onChange(String(num));
        return;
      }
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
      inputMode={inputMode}
      className={className}
    />
  );
});

LocalInput.displayName = "LocalInput";

export function ItensEncomendaManager({
  itens,
  onItensChange,
  onValorTotalChange,
  isTransportMode = false,
  onCancel,
  isSubmitting = false
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
    <GlassCard className="p-6 bg-[#f1f2f4] dark:bg-[#1c202a] border-border/50">
      <div className="flex items-center justify-between mb-6 border-b border-border/10 pb-4">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Itens da Encomenda</h3>
        </div>
        {!isTransportMode && (
          <Button
            type="button"
            variant="gradient"
            size="sm"
            onClick={adicionarItem}
            className="flex items-center gap-2 active:scale-95 transition-all shadow-md bg-[#457b77] hover:bg-[#457b77]/90 dark:bg-primary text-white border-0"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {itens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <Package className="h-12 w-12 opacity-50 mb-3" />
            <p>Nenhum item adicionado</p>
            <p className="text-sm opacity-70">Clique em "Adicionar Item" para começar</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Tabela */}
            <div className="hidden md:block rounded-lg border border-border/40 overflow-hidden">
              <table className="w-full text-sm bg-[#ffffff] dark:bg-[#252a36]">
                <thead className="bg-[#f9fafb] dark:bg-[#1c202a] border-b border-border/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[35%]">Produto</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[10%]">Qtd.</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[10%]">Peso Un.</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[12%]">Custo (€)</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[12%]">Venda (€)</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[15%]">Subtotal</th>
                    <th className="px-4 py-3 text-center w-[6%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {itens.map((item, index) => {
                    const itemKey = item.tempId || item.id || `fallback-${index}`;
                    const isFrete = isFreteItem(item);

                    return (
                      <tr key={itemKey} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2">
                          {isFrete ? (
                            <div className="h-9 px-3 py-2 bg-info/10 dark:bg-info/5 rounded-md border border-info/20 text-info font-medium flex items-center text-xs">
                              FRETE (SP - MRS)
                            </div>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-full">
                                    <Select
                                      value={item.produto_id}
                                      onValueChange={(value) => atualizarItem(index, "produto_id", value)}
                                      disabled={isTransportMode}
                                    >
                                      <SelectTrigger className="bg-[#f9fafb] dark:bg-[#2d3342] h-9 border-border/40 focus:border-primary/50 text-xs font-medium uppercase">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-[#ffffff] dark:bg-[#2d3342] border-border/40 max-h-[300px]">
                                        {produtos.map((p) => (
                                          <SelectItem key={p.id} value={p.id} className="text-xs cursor-pointer focus:bg-[#f1f2f4] dark:focus:bg-[#1c202a] uppercase">
                                            {p.nome} - {p.marca}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TooltipTrigger>
                                {item.produto_nome && (
                                  <TooltipContent side="top" className="max-w-[300px] break-words">
                                    <p className="font-semibold uppercase text-xs">{item.produto_nome}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <LocalInput
                            type="text"
                            inputMode="numeric"
                            value={item.quantidade}
                            onChange={(val) => atualizarItem(index, "quantidade", val)}
                            placeholder="0"
                            className="bg-[#f9fafb] dark:bg-[#2d3340] h-9 text-right text-xs w-16 ml-auto"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                          {isFrete ? "-" : (item.peso_produto ? `${item.peso_produto}g` : "0g")}
                        </td>
                        <td className="px-4 py-2">
                          <LocalInput
                            type="text"
                            inputMode="decimal"
                            value={item.preco_custo || ""}
                            onChange={(val) => atualizarItem(index, "preco_custo", val)}
                            placeholder="0.00"
                            className="bg-[#f9fafb] dark:bg-[#2d3340] h-9 text-right text-xs w-24 ml-auto"
                            disabled={isTransportMode}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <LocalInput
                            type="text"
                            inputMode="decimal"
                            value={item.preco_venda || ""}
                            onChange={(val) => atualizarItem(index, "preco_venda", val)}
                            placeholder="0.00"
                            className="bg-[#f9fafb] dark:bg-[#2d3340] h-9 text-right text-xs w-24 ml-auto"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-xs text-primary">
                          {formatCurrencyEUR(item.subtotal || 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => removerItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards Simplificados */}
            <div className="md:hidden space-y-4">
              {itens.map((item, index) => {
                const itemKey = item.tempId || item.id || `fallback-${index}-mob`;
                const isFrete = isFreteItem(item);
                return (
                  <div key={itemKey} className="bg-[#ffffff] dark:bg-[#252a36] p-4 rounded-lg border border-border/40 shadow-sm relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removerItem(index)}><Trash2 className="h-4 w-4" /></Button>
                    <div className="space-y-3 pr-8">
                      <div>
                        <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Produto</label>
                        {isFrete ? (
                          <div className="text-sm font-medium text-info">FRETE (SP - MRS)</div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Select value={item.produto_id} onValueChange={(v) => atualizarItem(index, "produto_id", v)} disabled={isTransportMode}>
                                    <SelectTrigger className="h-9 text-xs bg-[#f9fafb] dark:bg-[#2d3342] border-border/40 uppercase"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent className="bg-[#ffffff] dark:bg-[#2d3342] border-border/40">
                                      {produtos.map(p => <SelectItem key={p.id} value={p.id} className="text-xs uppercase">{p.nome} - {p.marca}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TooltipTrigger>
                              {item.produto_nome && (
                                <TooltipContent side="top" className="max-w-[250px] break-words">
                                  <p className="font-semibold uppercase text-xs">{item.produto_nome}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Qtd ({isFrete ? 'Kg' : 'Un'})</label>
                          <LocalInput type="text" inputMode={isFrete ? "decimal" : "numeric"} value={item.quantidade} onChange={(v) => atualizarItem(index, "quantidade", v)} className="h-9 text-xs bg-[#f9fafb] dark:bg-[#2d3342] w-full" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Custo (€)</label>
                          <LocalInput type="text" inputMode="decimal" value={item.preco_custo || ""} onChange={(v) => atualizarItem(index, "preco_custo", v)} className="h-9 text-xs bg-[#f9fafb] dark:bg-[#2d3342] w-full" disabled={isTransportMode} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Venda (€)</label>
                          <LocalInput type="text" inputMode="decimal" value={item.preco_venda || ""} onChange={(v) => atualizarItem(index, "preco_venda", v)} className="h-9 text-xs bg-[#f9fafb] dark:bg-[#2d3342] w-full" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-[#f1f2f4] dark:bg-[#1c202a] p-2 rounded text-xs border border-border/20">
                        <span className="font-semibold text-muted-foreground">SUBTOTAL</span>
                        <span className="font-bold text-primary">{formatCurrencyEUR(item.subtotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}


        {(itens.length > 0 || onCancel) && (
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-border/40 gap-4">
            <div className="flex gap-3 order-2 sm:order-1">
              {onCancel && (
                <Button
                  type="button"
                  variant="cancel"
                  className="h-10"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
              )}
              <Button
                type="submit"
                variant="gradient"
                className="bg-[#457b77] hover:bg-[#457b77]/90 dark:bg-primary text-white border-0 h-10"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </div>

            <div className="bg-[#ffffff] dark:bg-[#252a36] px-6 py-2.5 rounded-xl border border-border shadow-sm flex items-center gap-3 order-1 sm:order-2">
              <span className="text-sm font-medium text-gray-500 dark:text-[#9CA3AF] uppercase tracking-wider">Valor Total:</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrencyEUR(itens.reduce((total, item) => total + (item.subtotal || 0), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassCard >
  );
}

export default ItensEncomendaManager;
