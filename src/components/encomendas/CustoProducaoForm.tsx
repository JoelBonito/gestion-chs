import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Calculator,
  Package,
  Droplets,
  Tag,
  Factory,
  Truck,
  Hand,
  Receipt,
  CircleDollarSign,
  Zap,
  TrendingUp,
} from "lucide-react";
import { formatCurrencyEUR, formatCurrencyBRL, brlToEur, eurToBrl } from "@/lib/utils/currency";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CustoProducaoEncomenda } from "@/types/database";
import { calcularCustosAutomaticos, getAutoCalcTooltip } from "@/lib/config/cost-calculations";

interface CustoProducaoValues {
  garrafa: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  embalagem_carol: number;
  imposto: number;
  diversos: number;
}

const EMPTY_VALUES: CustoProducaoValues = {
  garrafa: 0,
  tampa: 0,
  rotulo: 0,
  producao_nonato: 0,
  frete_sp: 0,
  embalagem_carol: 0,
  imposto: 0,
  diversos: 0,
};

const FIELD_CONFIG = [
  { key: "garrafa" as const, label: "Garrafa", icon: Package },
  { key: "tampa" as const, label: "Tampa", icon: Droplets },
  { key: "rotulo" as const, label: "Rotulo", icon: Tag },
  { key: "producao_nonato" as const, label: "Producao Nonato", icon: Factory },
  { key: "frete_sp" as const, label: "Frete SP", icon: Truck },
  { key: "embalagem_carol" as const, label: "Embalagem Carol", icon: Hand },
  { key: "imposto" as const, label: "Imposto", icon: Receipt },
  { key: "diversos" as const, label: "Diversos", icon: CircleDollarSign },
];

// Fields that get auto-calculated from product weight
const AUTO_FIELDS = new Set(["frete_sp", "embalagem_carol", "imposto"]);

interface CustoProducaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encomendaId: string;
  itemEncomendaId: string;
  produtoId: string;
  produtoNome: string;
  precoVenda: number;
  sizeWeight?: number;
  custoProducao?: number;
  existingCusto?: CustoProducaoEncomenda | null;
  onSaved: () => void;
}

export function CustoProducaoForm({
  open,
  onOpenChange,
  encomendaId,
  itemEncomendaId,
  produtoId,
  produtoNome,
  precoVenda,
  sizeWeight,
  custoProducao,
  existingCusto,
  onSaved,
}: CustoProducaoFormProps) {
  const [loading, setLoading] = useState(false);
  const [garrafaIncluso, setGarrafaIncluso] = useState(
    existingCusto?.garrafa_incluso ?? false
  );
  const [tampaIncluso, setTampaIncluso] = useState(
    existingCusto?.tampa_incluso ?? false
  );

  // Auto-calculate frete_sp, embalagem_carol, imposto from weight
  const autoCalcValues = useMemo(
    () => (sizeWeight && sizeWeight > 0 ? calcularCustosAutomaticos(sizeWeight) : null),
    [sizeWeight]
  );

  // Build initial values from existing data or defaults (including auto-calc)
  const initialValues = useMemo((): CustoProducaoValues => {
    if (existingCusto) {
      return {
        garrafa: existingCusto.garrafa || 0,
        tampa: existingCusto.tampa || 0,
        rotulo: existingCusto.rotulo || 0,
        producao_nonato: existingCusto.producao_nonato || 0,
        frete_sp: existingCusto.frete_sp || 0,
        embalagem_carol: existingCusto.embalagem_carol || 0,
        imposto: existingCusto.imposto || 0,
        diversos: existingCusto.diversos || 0,
      };
    }
    // Pre-fill producao_nonato from product's custo_producao (EUR -> BRL)
    const producaoDefault = custoProducao ? eurToBrl(custoProducao) : 0;
    return {
      ...EMPTY_VALUES,
      producao_nonato: Math.round(producaoDefault * 100) / 100,
      frete_sp: autoCalcValues?.frete_sp || 0,
      embalagem_carol: autoCalcValues?.manuseio_carol || 0,
      imposto: autoCalcValues?.imposto || 0,
    };
  }, [existingCusto, custoProducao, autoCalcValues]);

  const [values, setValues] = useState<CustoProducaoValues>(initialValues);

  // Reset values when initialValues change (e.g., after save or reopening)
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Fields included in production cost are disabled and zeroed
  const INCLUSO_FIELDS: Record<string, { get: boolean; set: (v: boolean) => void }> = {
    garrafa: { get: garrafaIncluso, set: (v) => { setGarrafaIncluso(v); if (v) setValues((p) => ({ ...p, garrafa: 0 })); } },
    tampa: { get: tampaIncluso, set: (v) => { setTampaIncluso(v); if (v) setValues((p) => ({ ...p, tampa: 0 })); } },
  };

  const handleFieldChange = (key: keyof CustoProducaoValues, raw: string) => {
    const num = parseFloat(raw) || 0;
    setValues((prev) => ({ ...prev, [key]: num }));
  };

  const totalBRL = useMemo(
    () => Object.values(values).reduce((sum, v) => sum + (v || 0), 0),
    [values]
  );

  const totalEUR = useMemo(() => brlToEur(totalBRL), [totalBRL]);

  const lucroJoelReal = useMemo(
    () => Math.round((precoVenda - totalEUR) * 100) / 100,
    [precoVenda, totalEUR]
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      const custoTotalBrl = Math.round(totalBRL * 100) / 100;
      const custoTotalEur = Math.round(totalEUR * 100) / 100;
      const lucroReal = Math.round((precoVenda - custoTotalEur) * 100) / 100;

      const payload = {
        encomenda_id: encomendaId,
        item_encomenda_id: itemEncomendaId,
        produto_id: produtoId,
        garrafa: values.garrafa,
        tampa: values.tampa,
        rotulo: values.rotulo,
        producao_nonato: values.producao_nonato,
        frete_sp: values.frete_sp,
        embalagem_carol: values.embalagem_carol,
        imposto: values.imposto,
        diversos: values.diversos,
        custo_total_brl: custoTotalBrl,
        custo_total_eur: custoTotalEur,
        lucro_joel_real: lucroReal,
        garrafa_incluso: garrafaIncluso,
        tampa_incluso: tampaIncluso,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("custos_producao_encomenda")
        .upsert(payload, { onConflict: "encomenda_id,item_encomenda_id" });

      if (error) throw error;

      toast.success("Custos de producao salvos");
      onSaved();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao salvar custos";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-card w-full overflow-y-auto border-none sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-amber-400">
            <Calculator className="h-5 w-5" />
            Custos de Producao
          </SheetTitle>
          <SheetDescription className="truncate text-xs uppercase">
            {produtoNome}
          </SheetDescription>
        </SheetHeader>

        {/* Cost breakdown fields */}
        <TooltipProvider>
          <div className="space-y-3">
            {FIELD_CONFIG.map(({ key, label, icon: Icon }) => {
              const inclusoConfig = INCLUSO_FIELDS[key];
              const isIncluso = inclusoConfig?.get ?? false;
              const brlValue = values[key] || 0;
              const eurValue = brlToEur(brlValue);
              const isAutoField = AUTO_FIELDS.has(key);
              const hasAutoValue = isAutoField && autoCalcValues && sizeWeight && sizeWeight > 0;

              // Map embalagem_carol to manuseio_carol for auto-calc lookup
              const autoKey = key === "embalagem_carol" ? "manuseio_carol" : key;
              const autoValue = hasAutoValue
                ? autoCalcValues[autoKey as keyof typeof autoCalcValues]
                : undefined;
              const isAutoApplied = hasAutoValue && brlValue === autoValue;

              return (
                <div key={key} className="space-y-1">
                  <label className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                    <Icon className="h-3 w-3 text-amber-500/70" />
                    {label}
                    {hasAutoValue && !isIncluso && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase cursor-help",
                              isAutoApplied
                                ? "bg-emerald-500/15 text-emerald-500"
                                : "bg-yellow-500/15 text-yellow-500"
                            )}
                          >
                            <Zap className="h-2 w-2" />
                            {isAutoApplied ? "Auto" : "Editado"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          {getAutoCalcTooltip(
                            key === "embalagem_carol" ? "manuseio_carol" : key,
                            sizeWeight!
                          )}
                          {!isAutoApplied && (
                            <button
                              type="button"
                              className="mt-1 block text-emerald-400 hover:text-emerald-300 text-[10px] font-medium"
                              onClick={() => handleFieldChange(key, String(autoValue))}
                            >
                              Restaurar valor auto
                            </button>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {inclusoConfig && (
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className={cn(
                          "text-[8px] font-bold uppercase",
                          isIncluso ? "text-blue-400" : "text-muted-foreground/40"
                        )}>
                          Incluso na producao
                        </span>
                        <Switch
                          checked={isIncluso}
                          onCheckedChange={inclusoConfig.set}
                          className="h-4 w-7 data-[state=checked]:bg-blue-500"
                        />
                      </div>
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
                        value={isIncluso ? "" : (brlValue || "")}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        placeholder={isIncluso ? "Incluso" : "0,00"}
                        disabled={isIncluso}
                        className={cn(
                          "bg-accent border-border/50 text-foreground placeholder:text-muted-foreground/50 transition-all h-10 pl-9 tabular-nums",
                          isAutoApplied && !isIncluso && "border-emerald-500/30",
                          isIncluso && "opacity-40 cursor-not-allowed"
                        )}
                      />
                    </div>
                    <span className="text-muted-foreground/60 w-16 shrink-0 text-right text-[11px] tabular-nums">
                      {!isIncluso && brlValue > 0 ? `~ ${formatCurrencyEUR(eurValue)}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Weight warning */}
        {(!sizeWeight || sizeWeight <= 0) && (
          <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-center">
            <span className="text-[11px] text-yellow-500">
              Peso do produto nao definido. Frete, embalagem e imposto nao serao calculados automaticamente.
            </span>
          </div>
        )}

        {/* Total */}
        <div className="mt-6 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-[10px] font-bold tracking-wider text-amber-400/80 uppercase">
            Custo Total
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">
              {formatCurrencyBRL(totalBRL)}
            </span>
            <span className="text-muted-foreground text-sm font-medium tabular-nums">
              ~ {formatCurrencyEUR(totalEUR)}
            </span>
          </div>
        </div>

        {/* Lucro Joel Real */}
        <div
          className={cn(
            "mt-3 space-y-2 rounded-xl border p-4",
            lucroJoelReal >= 0
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          )}
        >
          <div
            className={cn(
              "text-[10px] font-bold tracking-wider uppercase flex items-center gap-1",
              lucroJoelReal >= 0 ? "text-emerald-400/80" : "text-red-400/80"
            )}
          >
            <TrendingUp className="h-3 w-3" />
            Lucro Joel (por unidade)
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={cn(
                "text-2xl font-bold",
                lucroJoelReal >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {formatCurrencyEUR(lucroJoelReal)}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              Venda {formatCurrencyEUR(precoVenda)} - Custo {formatCurrencyEUR(totalEUR)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
