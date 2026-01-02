import { useState, useEffect, useRef, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Box, Package, Euro, Save, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/shared";
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

const LocalInput = memo(
  ({
    value,
    onChange,
    type = "text",
    step,
    min,
    placeholder,
    disabled,
    className,
    id,
    debounce = false,
    inputMode,
  }: LocalInputProps) => {
    const [localValue, setLocalValue] = useState(String(value ?? ""));
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFocusedRef = useRef(false);

    // Sincronizar com valor externo apenas quando NÃO está focado
    useEffect(() => {
      if (!isFocusedRef.current) {
        if (inputMode === "decimal" && value !== undefined && value !== null && value !== "") {
          const val = Number(value);
          setLocalValue(
            val.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          );
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
      if (e.key === "Enter") {
        handleBlur();
      }
    };

    const handleBlur = () => {
      isFocusedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const finalValue = localValue;
      if (inputMode === "decimal" && localValue) {
        // Normalizar para o pai (trocar , por . para o Number)
        const normalized = localValue.replace(/\./g, "").replace(",", ".");
        const num = parseFloat(normalized);
        if (!isNaN(num)) {
          setLocalValue(
            num.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          );
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
  }
);

LocalInput.displayName = "LocalInput";

export function ItensEncomendaManager({
  itens,
  onItensChange,
  onValorTotalChange,
  isTransportMode = false,
  onCancel,
  isSubmitting = false,
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

  const atualizarItem = useCallback(
    (index: number, campo: keyof ItemEncomenda, valor: any) => {
      const novosItens = [...itens];
      const item = { ...novosItens[index] };

      if (campo === "produto_id") {
        const produto = produtos.find((p) => p.id === valor);
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
    },
    [itens, produtos, onItensChange]
  );

  const isFreteItem = (item: ItemEncomenda) => {
    return item.produto_id === "00000000-0000-0000-0000-000000000001";
  };

  return (
    <GlassCard className="border-border/50 bg-secondary/30 p-6 dark:bg-card">
      <div className="border-border/10 mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Box className="text-primary h-5 w-5" />
          <h3 className="text-lg font-semibold">Itens da Encomenda</h3>
        </div>
        {!isTransportMode && (
          <Button
            type="button"
            variant="gradient"
            size="sm"
            onClick={adicionarItem}
            className="dark:bg-primary flex items-center gap-2 border-0 bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {itens.length === 0 ? (
          <div className="text-muted-foreground border-border/50 bg-muted/20 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
            <Package className="mb-3 h-12 w-12 opacity-50" />
            <p>Nenhum item adicionado</p>
            <p className="text-sm opacity-70">Clique em "Adicionar Item" para começar</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Tabela */}
            <div className="border-border/40 hidden overflow-hidden rounded-lg border xl:block">
              <table className="w-full bg-card text-sm">
                <thead className="border-border/40 border-b bg-muted/50">
                  <tr>
                    <th className="text-muted-foreground w-[35%] px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase">
                      Produto
                    </th>
                    <th className="text-muted-foreground w-[10%] px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                      Qtd.
                    </th>
                    <th className="text-muted-foreground w-[10%] px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                      Peso Un.
                    </th>
                    <th className="text-muted-foreground w-[12%] px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                      Custo (€)
                    </th>
                    <th className="text-muted-foreground w-[12%] px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                      Venda (€)
                    </th>
                    <th className="text-muted-foreground w-[15%] px-4 py-3 text-right text-[10px] font-semibold tracking-wider uppercase">
                      Subtotal
                    </th>
                    <th className="w-[6%] px-4 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-border/10 divide-y">
                  {itens.map((item, index) => {
                    const itemKey = item.tempId || item.id || `fallback-${index}`;
                    const isFrete = isFreteItem(item);

                    return (
                      <tr key={itemKey} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2">
                          {isFrete ? (
                            <div className="bg-info/10 dark:bg-info/5 border-info/20 text-info flex h-9 items-center rounded-md border px-3 py-2 text-xs font-medium">
                              FRETE (SP - MRS)
                            </div>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-full">
                                    <Select
                                      value={item.produto_id}
                                      onValueChange={(value) =>
                                        atualizarItem(index, "produto_id", value)
                                      }
                                      disabled={isTransportMode}
                                    >
                                      <SelectTrigger className="border-border/40 focus:border-primary/50 h-9 bg-background text-xs font-medium uppercase">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent className="border-border/40 max-h-[300px] bg-popover">
                                        {produtos.map((p) => (
                                          <SelectItem
                                            key={p.id}
                                            value={p.id}
                                            className="cursor-pointer text-xs uppercase focus:bg-accent focus:text-accent-foreground"
                                          >
                                            {p.nome} - {p.marca}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TooltipTrigger>
                                {item.produto_nome && (
                                  <TooltipContent side="top" className="max-w-[300px] break-words">
                                    <p className="text-xs font-semibold uppercase">
                                      {item.produto_nome}
                                    </p>
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
                            className="ml-auto h-9 w-16 bg-background text-right text-xs"
                          />
                        </td>
                        <td className="text-muted-foreground px-4 py-2 text-right text-xs">
                          {isFrete ? "-" : item.peso_produto ? `${item.peso_produto}g` : "0g"}
                        </td>
                        <td className="px-4 py-2">
                          <LocalInput
                            type="text"
                            inputMode="decimal"
                            value={item.preco_custo || ""}
                            onChange={(val) => atualizarItem(index, "preco_custo", val)}
                            placeholder="0.00"
                            className="ml-auto h-9 w-24 bg-background text-right text-xs"
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
                            className="ml-auto h-9 w-24 bg-background text-right text-xs"
                          />
                        </td>
                        <td className="text-primary px-4 py-2 text-right text-xs font-medium">
                          {formatCurrencyEUR(item.subtotal || 0)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 transition-colors group-hover:opacity-100"
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
            <div className="space-y-4 xl:hidden">
              {itens.map((item, index) => {
                const itemKey = item.tempId || item.id || `fallback-${index}-mob`;
                const isFrete = isFreteItem(item);
                return (
                  <div
                    key={itemKey}
                    className="border-border/40 relative rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive absolute top-2 right-2 h-7 w-7"
                      onClick={() => removerItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3 pr-8">
                      <div>
                        <label className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase">
                          Produto
                        </label>
                        {isFrete ? (
                          <div className="text-info text-sm font-medium">FRETE (SP - MRS)</div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Select
                                    value={item.produto_id}
                                    onValueChange={(v) => atualizarItem(index, "produto_id", v)}
                                    disabled={isTransportMode}
                                  >
                                    <SelectTrigger className="border-border/40 h-9 bg-background text-xs uppercase">
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="border-border/40 bg-popover">
                                      {produtos.map((p) => (
                                        <SelectItem
                                          key={p.id}
                                          value={p.id}
                                          className="text-xs uppercase"
                                        >
                                          {p.nome} - {p.marca}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TooltipTrigger>
                              {item.produto_nome && (
                                <TooltipContent side="top" className="max-w-[250px] break-words">
                                  <p className="text-xs font-semibold uppercase">
                                    {item.produto_nome}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase">
                            Qtd ({isFrete ? "Kg" : "Un"})
                          </label>
                          <LocalInput
                            type="text"
                            inputMode={isFrete ? "decimal" : "numeric"}
                            value={item.quantidade}
                            onChange={(v) => atualizarItem(index, "quantidade", v)}
                            className="h-9 w-full bg-background text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase">
                            Custo (€)
                          </label>
                          <LocalInput
                            type="text"
                            inputMode="decimal"
                            value={item.preco_custo || ""}
                            onChange={(v) => atualizarItem(index, "preco_custo", v)}
                            className="h-9 w-full bg-background text-xs"
                            disabled={isTransportMode}
                          />
                        </div>
                        <div>
                          <label className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase">
                            Venda (€)
                          </label>
                          <LocalInput
                            type="text"
                            inputMode="decimal"
                            value={item.preco_venda || ""}
                            onChange={(v) => atualizarItem(index, "preco_venda", v)}
                            className="h-9 w-full bg-background text-xs"
                          />
                        </div>
                      </div>
                      <div className="border-border/20 flex items-center justify-between rounded border bg-muted/50 p-2 text-xs">
                        <span className="text-muted-foreground font-semibold">SUBTOTAL</span>
                        <span className="text-primary font-bold">
                          {formatCurrencyEUR(item.subtotal || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(itens.length > 0 || onCancel) && (
          <div className="border-border/40 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
            <div className="order-2 flex gap-3 sm:order-1">
              {onCancel && (
                <Button
                  type="button"
                  variant="cancel"
                  className="h-10"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              )}
              <Button
                type="submit"
                variant="gradient"
                className="dark:bg-primary h-10 border-0 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </div>

            <div className="border-border order-1 flex items-center gap-3 rounded-xl border bg-card px-6 py-2.5 shadow-sm sm:order-2">
              <span className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                Valor Total:
              </span>
              <span className="text-primary text-2xl font-bold">
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
