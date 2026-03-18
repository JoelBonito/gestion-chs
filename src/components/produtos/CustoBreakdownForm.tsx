import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Calculator, Package, Droplets, Tag, Factory, Truck, Hand, Receipt, Import, ChevronsUpDown, Check, Zap } from "lucide-react";
import { formatCurrencyEUR, formatCurrencyBRL, brlToEur } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { CustoBreakdown } from "@/types/database";
import { PriceTypeConfig, PRICE_COLOR_CLASSES } from "@/lib/config/price-types";
import { calcularCustosAutomaticos, AUTO_CALCULATED_FIELDS, getAutoCalcTooltip } from "@/lib/config/cost-calculations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EMPTY_BREAKDOWN: CustoBreakdown = {
  embalagem: 0,
  tampa: 0,
  rotulo: 0,
  producao_nonato: 0,
  frete_sp: 0,
  manuseio_carol: 0,
  imposto: 0,
};

const FIELD_CONFIG = [
  { key: "embalagem" as const, label: "Embalagem", icon: Package },
  { key: "tampa" as const, label: "Tampa", icon: Droplets },
  { key: "rotulo" as const, label: "Rótulo", icon: Tag },
  { key: "producao_nonato" as const, label: "Produção", icon: Factory },
  { key: "frete_sp" as const, label: "Frete SP", icon: Truck },
  { key: "manuseio_carol" as const, label: "Manuseio Carol", icon: Hand },
  { key: "imposto" as const, label: "Imposto", icon: Receipt },
];

interface EstoqueValues {
  garrafas: number;
  tampas: number;
  rotulos: number;
}

interface CustoBreakdownFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoId: string;
  produtoNome: string;
  produtoMarca?: string;
  priceType: PriceTypeConfig;
  breakdown?: CustoBreakdown | null;
  fallbackBreakdown?: CustoBreakdown | null;
  estoqueInicial?: EstoqueValues;
  sizeWeight?: number; // Weight in grams for auto-calculating frete, manuseio, imposto
  onSaved: () => void;
}

const EMPTY_ESTOQUE: EstoqueValues = { garrafas: 0, tampas: 0, rotulos: 0 };

interface ImportProduct {
  id: string;
  nome: string;
}

export function CustoBreakdownForm({
  open,
  onOpenChange,
  produtoId,
  produtoNome,
  produtoMarca,
  priceType,
  breakdown,
  fallbackBreakdown,
  estoqueInicial,
  sizeWeight,
  onSaved,
}: CustoBreakdownFormProps) {
  // Auto-fill on mount: if no breakdown, use fallback (Tabela data)
  const initialValues = useMemo(() => {
    if (!breakdown && fallbackBreakdown) return fallbackBreakdown;
    return breakdown || EMPTY_BREAKDOWN;
  }, [breakdown, fallbackBreakdown]);

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<CustoBreakdown>(initialValues);
  const [estoque, setEstoque] = useState<EstoqueValues>(estoqueInicial || EMPTY_ESTOQUE);
  const [showImport, setShowImport] = useState(false);
  const [importProducts, setImportProducts] = useState<ImportProduct[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importPopoverOpen, setImportPopoverOpen] = useState(false);
  const [didAutoFill, setDidAutoFill] = useState(false);

  const colors = PRICE_COLOR_CLASSES[priceType.color] || PRICE_COLOR_CLASSES.violet;

  // Show auto-fill toast on mount when fallback was used
  useEffect(() => {
    if (!breakdown && fallbackBreakdown && !didAutoFill) {
      setDidAutoFill(true);
      toast.info("Valores copiados do Custo Tabela como base");
    }
  }, [breakdown, fallbackBreakdown, didAutoFill]);

  // Auto-calculate frete_sp, manuseio_carol, imposto from weight
  const autoCalcValues = useMemo(
    () => (sizeWeight && sizeWeight > 0 ? calcularCustosAutomaticos(sizeWeight) : null),
    [sizeWeight]
  );

  // Always apply auto-calculated values when form opens (overwrite previous values)
  useEffect(() => {
    if (!open || !autoCalcValues || priceType.key !== "tabela") return;
    setValues((prev) => ({
      ...prev,
      frete_sp: autoCalcValues.frete_sp,
      manuseio_carol: autoCalcValues.manuseio_carol,
      imposto: autoCalcValues.imposto,
    }));
    toast.info("Frete, manuseio e imposto calculados pelo peso");
  }, [open, autoCalcValues, priceType.key]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onOpenChange(false);
    }
  };

  const handleFieldChange = (key: keyof CustoBreakdown, raw: string) => {
    const num = parseFloat(raw) || 0;
    setValues((prev) => ({ ...prev, [key]: num }));
  };

  const totalBRL = useMemo(
    () => Object.values(values).reduce((sum, v) => sum + (v || 0), 0),
    [values]
  );

  const totalEUR = useMemo(() => brlToEur(totalBRL), [totalBRL]);

  // Load import products when toggled
  useEffect(() => {
    if (!showImport || !produtoMarca) return;
    setImportLoading(true);
    supabase
      .from("produtos")
      .select("id, nome")
      .eq("marca", produtoMarca)
      .neq("id", produtoId)
      .order("nome")
      .then(({ data, error }) => {
        if (!error && data) {
          setImportProducts(data);
        }
        setImportLoading(false);
      });
  }, [showImport, produtoMarca, produtoId]);

  const handleImport = async (selectedId: string) => {
    const product = importProducts.find((p) => p.id === selectedId);
    if (!product) return;

    // Lazy-load only the breakdown data for the selected product
    const { data, error } = await supabase
      .from("produtos")
      .select("custo_nonato_breakdown, custo_tabela_breakdown, custo_plus25_breakdown")
      .eq("id", selectedId)
      .single();

    if (error || !data) {
      toast.error("Erro ao carregar dados do produto");
      return;
    }

    const breakdownMap: Record<string, CustoBreakdown | null> = {
      custo_nonato_breakdown: data.custo_nonato_breakdown as CustoBreakdown | null,
      custo_tabela_breakdown: data.custo_tabela_breakdown as CustoBreakdown | null,
      custo_plus25_breakdown: data.custo_plus25_breakdown as CustoBreakdown | null,
    };

    const imported = breakdownMap[priceType.breakdownField]
      || (data.custo_tabela_breakdown as CustoBreakdown | null)
      || (data.custo_nonato_breakdown as CustoBreakdown | null);
    if (imported) {
      setValues(imported);
      toast.success(`Dados importados de ${product.nome}`);
      setShowImport(false);
      setImportPopoverOpen(false);
    } else {
      toast.error("Produto selecionado não tem dados de custo");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        [priceType.breakdownField]: values,
        [priceType.priceField]: Math.round(totalEUR * 100) / 100,
      };

      // Save estoque from Tabela form (primary form)
      if (priceType.key === "tabela") {
        payload.estoque_garrafas = estoque.garrafas;
        payload.estoque_tampas = estoque.tampas;
        payload.estoque_rotulos = estoque.rotulos;

        // Auto-calculate 50/50 breakdown: same as Tabela but production -20%
        const nonato5050: CustoBreakdown = {
          embalagem: values.embalagem,
          tampa: values.tampa,
          rotulo: values.rotulo,
          producao_nonato: Math.round(values.producao_nonato * 0.80 * 100) / 100,
          frete_sp: values.frete_sp,
          manuseio_carol: values.manuseio_carol,
          imposto: values.imposto,
        };
        const total5050BRL = Object.values(nonato5050).reduce((s, v) => s + (v || 0), 0);
        payload.custo_nonato_breakdown = nonato5050;
        payload.preco_nonato = Math.round(brlToEur(total5050BRL) * 100) / 100;

        // Auto-calculate +25% breakdown: no embalagem/tampa/rotulo, production +25%
        const plus25: CustoBreakdown = {
          embalagem: 0,
          tampa: 0,
          rotulo: 0,
          producao_nonato: Math.round(values.producao_nonato * 1.25 * 100) / 100,
          frete_sp: values.frete_sp,
          manuseio_carol: values.manuseio_carol,
          imposto: values.imposto,
        };
        const totalPlus25BRL = Object.values(plus25).reduce((s, v) => s + (v || 0), 0);
        payload.custo_plus25_breakdown = plus25;
        payload.preco_plus25 = Math.round(brlToEur(totalPlus25BRL) * 100) / 100;
      }

      const { data: updated, error } = await supabase
        .from("produtos")
        .update(payload)
        .eq("id", produtoId)
        .select("id")
        .single();

      if (error) throw error;
      if (!updated) throw new Error("Sem permissão para atualizar este produto");
      toast.success(
        priceType.key === "tabela"
          ? "Custo Tabela salvo (50/50 e +25% calculados automaticamente)"
          : `${priceType.sheetTitle} salvo com sucesso`
      );
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Erro ao salvar ${priceType.sheetTitle}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="bg-card w-full overflow-y-auto border-none sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className={cn("flex items-center gap-2", colors.text)}>
            <Calculator className="h-5 w-5" />
            {priceType.sheetTitle}
          </SheetTitle>
          <SheetDescription className="truncate text-xs uppercase">
            {produtoNome}
          </SheetDescription>
        </SheetHeader>

        {/* Import from another product - only for Tabela (primary form) */}
        {produtoMarca && priceType.key === "tabela" && (
          <div className="mb-4">
            {!showImport ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowImport(true)}
              >
                <Import className="mr-2 h-3.5 w-3.5" />
                Importar de outro produto
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-border/30 bg-muted/20 p-3">
                <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Selecionar produto da mesma marca
                </label>
                {importLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : importProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum produto encontrado com a mesma marca</p>
                ) : (
                  <Popover open={importPopoverOpen} onOpenChange={setImportPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={importPopoverOpen}
                        className="w-full justify-between bg-accent border-border/50 h-9 text-xs font-normal"
                      >
                        Buscar produto...
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar por nome..." className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
                            Nenhum produto encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            {importProducts.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.nome}
                                onSelect={() => handleImport(p.id)}
                                className="text-xs cursor-pointer"
                              >
                                {p.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setShowImport(false)}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Read-only notice for derived price types */}
        {priceType.key !== "tabela" && (
          <div className="mb-4 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
            <span className="text-xs text-muted-foreground">
              Valores calculados automaticamente a partir do Custo Tabela
            </span>
          </div>
        )}

        {/* Cost breakdown fields */}
        <TooltipProvider>
          <div className="space-y-3">
            {FIELD_CONFIG.map(({ key, label, icon: Icon }) => {
              const brlValue = values[key] || 0;
              const eurValue = brlToEur(brlValue);
              const isReadOnly = priceType.key !== "tabela";
              const isAutoField = AUTO_CALCULATED_FIELDS.has(key);
              const hasAutoValue = isAutoField && autoCalcValues && sizeWeight && sizeWeight > 0;
              const isAutoApplied = hasAutoValue && brlValue === autoCalcValues[key as keyof typeof autoCalcValues];
              return (
                <div key={key} className="space-y-1">
                  <label className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                    <Icon className={cn("h-3 w-3", `${colors.text}/70`)} />
                    {label}
                    {hasAutoValue && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase cursor-help",
                            isAutoApplied
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-yellow-500/15 text-yellow-500"
                          )}>
                            <Zap className="h-2 w-2" />
                            {isAutoApplied ? "Auto" : "Editado"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          {getAutoCalcTooltip(key, sizeWeight!)}
                          {!isAutoApplied && (
                            <button
                              type="button"
                              className="mt-1 block text-emerald-400 hover:text-emerald-300 text-[10px] font-medium"
                              onClick={() => handleFieldChange(key, String(autoCalcValues[key as keyof typeof autoCalcValues]))}
                            >
                              Restaurar valor auto
                            </button>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={brlValue || ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        placeholder="0,00"
                        readOnly={isReadOnly}
                        className={cn(
                          "bg-accent border-border/50 text-foreground placeholder:text-muted-foreground/50 transition-all h-10 pl-9 tabular-nums",
                          isReadOnly && "opacity-60 cursor-not-allowed",
                          isAutoApplied && priceType.key === "tabela" && "border-emerald-500/30",
                        )}
                      />
                    </div>
                    <span className="text-muted-foreground/60 w-16 shrink-0 text-right text-[11px] tabular-nums">
                      {brlValue > 0 ? `≈ ${formatCurrencyEUR(eurValue)}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Warning if weight not set */}
        {priceType.key === "tabela" && (!sizeWeight || sizeWeight <= 0) && (
          <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-center">
            <span className="text-[11px] text-yellow-500">
              Preencha o peso do produto para calcular frete, manuseio e imposto automaticamente
            </span>
          </div>
        )}

        {/* Total */}
        <div className={cn("mt-6 space-y-2 rounded-xl border p-4", colors.border, colors.bg)}>
          <div className={cn("text-[10px] font-bold tracking-wider uppercase", colors.textLight)}>
            Total {priceType.sheetTitle}
          </div>
          <div className="flex items-baseline justify-between">
            <span className={cn("text-2xl font-bold", colors.text)}>
              {formatCurrencyBRL(totalBRL)}
            </span>
            <span className="text-muted-foreground text-sm font-medium tabular-nums">
              ≈ {formatCurrencyEUR(totalEUR)}
            </span>
          </div>
        </div>

        {/* Estoque - only for Tabela type (primary form) */}
        {priceType.key === "tabela" && (
          <div className="mt-6 space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
              Estoque de Insumos
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "garrafas" as const, label: "Garrafas", icon: Package },
                { key: "tampas" as const, label: "Tampas", icon: Droplets },
                { key: "rotulos" as const, label: "Rótulos", icon: Tag },
              ]).map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-1">
                  <label className="text-muted-foreground flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase">
                    <Icon className="h-2.5 w-2.5 text-cyan-500/70" />
                    {label}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={estoque[key] || ""}
                    onChange={(e) =>
                      setEstoque((prev) => ({
                        ...prev,
                        [key]: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="bg-accent border-border/50 text-foreground transition-all h-10 text-center tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save (only for Tabela) / Close (for derived types) */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {priceType.key === "tabela" ? "Cancelar" : "Fechar"}
          </Button>
          {priceType.key === "tabela" && (
            <Button
              onClick={handleSave}
              disabled={loading || totalBRL === 0}
              className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Backward compatibility alias
export { CustoBreakdownForm as CustoNonatoForm };
