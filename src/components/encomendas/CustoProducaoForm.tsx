import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  Calculator,
} from "lucide-react";
import { formatCurrencyEUR, formatCurrencyBRL, brlToEur, eurToBrl } from "@/lib/utils/currency";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CustoProducaoEncomenda, CustoBreakdown } from "@/types/database";
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
  { key: "producao_nonato" as const, label: "Produção", icon: Factory },
  { key: "frete_sp" as const, label: "Frete SP", icon: Truck },
  { key: "embalagem_carol" as const, label: "Embalagem", icon: Hand },
  { key: "imposto" as const, label: "Imposto", icon: Receipt },
  { key: "diversos" as const, label: "Diversos", icon: CircleDollarSign },
];

const AUTO_FIELDS = new Set(["frete_sp", "embalagem_carol", "imposto"]);

interface CustoProducaoFormProps {
  encomendaId: string;
  itemEncomendaId: string;
  produtoId: string;
  produtoNome: string;
  precoVenda: number;
  quantidade: number;
  sizeWeight?: number;
  custoProducao?: number;
  breakdownDefault?: CustoBreakdown | null;
  existingCusto?: CustoProducaoEncomenda | null;
  onSaved: () => void;
}

export function CustoProducaoForm({
  encomendaId,
  itemEncomendaId,
  produtoId,
  produtoNome,
  precoVenda,
  quantidade,
  sizeWeight,
  custoProducao,
  breakdownDefault,
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

  const autoCalcValues = useMemo(
    () => (sizeWeight && sizeWeight > 0 ? calcularCustosAutomaticos(sizeWeight) : null),
    [sizeWeight]
  );

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
    if (breakdownDefault && typeof breakdownDefault === "object") {
      return {
        garrafa: breakdownDefault.garrafa ?? 0,
        tampa: breakdownDefault.tampa ?? 0,
        rotulo: breakdownDefault.rotulo ?? 0,
        producao_nonato: breakdownDefault.producao_nonato ?? 0,
        frete_sp: breakdownDefault.frete_sp ?? autoCalcValues?.frete_sp ?? 0,
        embalagem_carol: breakdownDefault.embalagem_carol ?? autoCalcValues?.manuseio_carol ?? 0,
        imposto: breakdownDefault.imposto ?? autoCalcValues?.imposto ?? 0,
        diversos: breakdownDefault.diversos ?? 0,
      };
    }
    const producaoDefault = custoProducao ? eurToBrl(custoProducao) : 0;
    return {
      ...EMPTY_VALUES,
      producao_nonato: Math.round(producaoDefault * 100) / 100,
      frete_sp: autoCalcValues?.frete_sp || 0,
      embalagem_carol: autoCalcValues?.manuseio_carol || 0,
      imposto: autoCalcValues?.imposto || 0,
    };
  }, [existingCusto, breakdownDefault, custoProducao, autoCalcValues]);

  const [values, setValues] = useState<CustoProducaoValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const INCLUSO_FIELDS: Record<string, { get: boolean; set: (v: boolean) => void }> = {
    garrafa: { get: garrafaIncluso, set: (v) => { setGarrafaIncluso(v); if (v) setValues((p) => ({ ...p, garrafa: 0 })); } },
    tampa: { get: tampaIncluso, set: (v) => { setTampaIncluso(v); if (v) setValues((p) => ({ ...p, tampa: 0 })); } },
  };

  const handleFieldChange = (key: keyof CustoProducaoValues, raw: string) => {
    if (raw === "") {
      // allow empty intermediate states if needed, but save as 0
      setValues((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    const num = parseFloat(raw.replace(',', '.'));
    if (!isNaN(num)) {
      setValues((prev) => ({ ...prev, [key]: num }));
    }
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
  
  const isFilled = !!existingCusto;

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
        garrafa: garrafaIncluso ? 0 : values.garrafa,
        tampa: tampaIncluso ? 0 : values.tampa,
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

      toast.success("Custos salvos para " + produtoNome);
      onSaved();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao salvar custos";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER ITEM */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="truncate text-sm font-bold uppercase text-foreground">
              {produtoNome}
            </h3>
            {isFilled ? (
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[9px] shrink-0 font-bold uppercase tracking-wider">
                Preenchido
              </Badge>
            ) : (
              <Badge className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[9px] shrink-0 font-bold uppercase tracking-wider">
                <AlertCircle className="mr-1 h-2.5 w-2.5" />
                Pendente
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center text-[11px] text-muted-foreground">
            <span className="bg-muted px-2 py-1 rounded-md border border-border/50 text-foreground">
              Qtd: <span className="font-bold text-foreground">{quantidade}</span>
            </span>
            <span className="bg-muted px-2 py-1 rounded-md border border-border/50 text-foreground">
              Venda (un): <span className="font-bold text-primary">{formatCurrencyEUR(precoVenda)}</span>
            </span>
            {(!sizeWeight || sizeWeight <= 0) && (
              <span className="text-yellow-500 font-medium ml-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Peso não definido
              </span>
            )}
          </div>
        </div>
      </div>

      {/* INPUTS GRID */}
      <TooltipProvider>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4 mt-2">
          {FIELD_CONFIG.map(({ key, label, icon: Icon }) => {
            const inclusoConfig = INCLUSO_FIELDS[key];
            const isIncluso = inclusoConfig?.get ?? false;
            const brlValue = values[key] || 0;
            const isAutoField = AUTO_FIELDS.has(key);
            const hasAutoValue = isAutoField && autoCalcValues && sizeWeight && sizeWeight > 0;

            const autoKey = key === "embalagem_carol" ? "manuseio_carol" : key;
            const autoValue = hasAutoValue
              ? autoCalcValues[autoKey as keyof typeof autoCalcValues]
              : undefined;
            const isAutoApplied = hasAutoValue && brlValue === autoValue;

            return (
              <div key={key} className="space-y-1.5 flex flex-col justify-end">
                <label className="text-muted-foreground flex items-center justify-between gap-1 text-[9px] font-bold tracking-widest uppercase mb-1">
                  <span className="flex items-center gap-1">
                    <Icon className="h-3 w-3 text-amber-500/70" />
                    {label}
                  </span>
                  
                  {/* Tooltips and Icons */}
                  <div className="flex items-center gap-1">
                    {hasAutoValue && !isIncluso && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center justify-center rounded p-0.5 cursor-help",
                              isAutoApplied
                                ? "text-emerald-500 bg-emerald-500/10"
                                : "text-amber-500 bg-amber-500/10"
                            )}
                          >
                            <Zap className="h-2.5 w-2.5" />
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
                      <Switch
                        checked={isIncluso}
                        onCheckedChange={inclusoConfig.set}
                        className="h-3 w-5 data-[state=checked]:bg-blue-500 shrink-0 shadow-sm"
                        aria-label="Incluso na produção"
                      />
                    )}
                  </div>
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={isIncluso ? "" : (brlValue || "")}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={isIncluso ? "Incl." : "0"}
                    disabled={isIncluso}
                    className={cn(
                      "bg-accent border-border/50 text-foreground text-sm font-medium placeholder:text-muted-foreground/40 transition-all h-9 pl-7 pr-2 tabular-nums rounded-md focus-visible:ring-1 focus-visible:ring-amber-500",
                      isAutoApplied && !isIncluso && "border-emerald-500/30 bg-emerald-500/5",
                      isIncluso && "opacity-40 cursor-not-allowed bg-muted"
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </TooltipProvider>

      {/* FOOTER TOTALS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 mt-2 border-t border-border/50">
        
        {/* Cost & Margins */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col gap-0.5 pr-4 sm:pr-6 border-r border-border/40">
            <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="h-3 w-3" /> Custo Unit. Total
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-bold text-amber-500 tabular-nums">
                {formatCurrencyBRL(totalBRL)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">
               aprox. {formatCurrencyEUR(totalEUR)}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
              lucroJoelReal >= 0 ? "text-emerald-500/80" : "text-red-500/80"
            )}>
              <TrendingUp className="h-3 w-3" /> Lucro Real (un)
            </span>
            <span className={cn(
              "text-base sm:text-lg font-bold tabular-nums mt-0.5",
              lucroJoelReal >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {formatCurrencyEUR(lucroJoelReal)}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  Comissão na Linha: 
               </span>
               <span className={cn("text-[11px] font-bold tabular-nums whitespace-nowrap", lucroJoelReal >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {formatCurrencyEUR(lucroJoelReal * quantidade)}
               </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSave}
          disabled={loading || totalBRL === 0}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 font-bold shadow-sm transition-all text-xs"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isFilled ? "Atualizar Custos" : "Salvar Custos"}
        </Button>
      </div>

    </div>
  );
}
