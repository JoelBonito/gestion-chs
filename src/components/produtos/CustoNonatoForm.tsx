import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Calculator, Package, Droplets, Tag, Factory, Truck, Hand, Receipt } from "lucide-react";
import { formatCurrencyEUR, formatCurrencyBRL, brlToEur } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CustoNonatoBreakdown {
  embalagem: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  manuseio_carol: number;
  imposto: number;
}

const EMPTY_BREAKDOWN: CustoNonatoBreakdown = {
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
  { key: "producao_nonato" as const, label: "Produção Nonato", icon: Factory },
  { key: "frete_sp" as const, label: "Frete SP", icon: Truck },
  { key: "manuseio_carol" as const, label: "Manuseio Carol", icon: Hand },
  { key: "imposto" as const, label: "Imposto", icon: Receipt },
];

interface EstoqueValues {
  garrafas: number;
  tampas: number;
  rotulos: number;
}

interface CustoNonatoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoId: string;
  produtoNome: string;
  breakdown?: CustoNonatoBreakdown | null;
  estoqueInicial?: EstoqueValues;
  onSaved: () => void;
}

const InputStyles =
  "bg-accent border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all h-10";

const EMPTY_ESTOQUE: EstoqueValues = { garrafas: 0, tampas: 0, rotulos: 0 };

export function CustoNonatoForm({
  open,
  onOpenChange,
  produtoId,
  produtoNome,
  breakdown,
  estoqueInicial,
  onSaved,
}: CustoNonatoFormProps) {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<CustoNonatoBreakdown>(
    breakdown || EMPTY_BREAKDOWN
  );
  const [estoque, setEstoque] = useState<EstoqueValues>(
    estoqueInicial || EMPTY_ESTOQUE
  );

  // Reset values when sheet opens with new data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setValues(breakdown || EMPTY_BREAKDOWN);
      setEstoque(estoqueInicial || EMPTY_ESTOQUE);
    }
    onOpenChange(isOpen);
  };

  const handleFieldChange = (key: keyof CustoNonatoBreakdown, raw: string) => {
    const num = parseFloat(raw) || 0;
    setValues((prev) => ({ ...prev, [key]: num }));
  };

  const totalBRL = useMemo(
    () => Object.values(values).reduce((sum, v) => sum + (v || 0), 0),
    [values]
  );

  const totalEUR = useMemo(() => brlToEur(totalBRL), [totalBRL]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("produtos")
        .update({
          custo_nonato_breakdown: values as any,
          preco_nonato: Math.round(totalEUR * 100) / 100,
          estoque_garrafas: estoque.garrafas,
          estoque_tampas: estoque.tampas,
          estoque_rotulos: estoque.rotulos,
        })
        .eq("id", produtoId);

      if (error) throw error;
      toast.success("Custo Nonato e estoque salvos com sucesso");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar custo nonato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="bg-card w-full overflow-y-auto border-none sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-violet-500">
            <Calculator className="h-5 w-5" />
            Custo Nonato
          </SheetTitle>
          <SheetDescription className="truncate text-xs uppercase">
            {produtoNome}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3">
          {FIELD_CONFIG.map(({ key, label, icon: Icon }) => {
            const brlValue = values[key] || 0;
            const eurValue = brlToEur(brlValue);
            return (
              <div key={key} className="space-y-1">
                <label className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                  <Icon className="h-3 w-3 text-violet-500/70" />
                  {label}
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
                      className={cn(InputStyles, "pl-9 tabular-nums")}
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

        {/* Total */}
        <div className="mt-6 space-y-2 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
          <div className="text-[10px] font-bold tracking-wider text-violet-400 uppercase">
            Total Custo Nonato
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-violet-500">
              {formatCurrencyBRL(totalBRL)}
            </span>
            <span className="text-muted-foreground text-sm font-medium tabular-nums">
              ≈ {formatCurrencyEUR(totalEUR)}
            </span>
          </div>
        </div>

        {/* Estoque */}
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
                  className={cn(InputStyles, "text-center tabular-nums")}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || totalBRL === 0}
            className="flex-1 bg-violet-600 text-white hover:bg-violet-700"
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
