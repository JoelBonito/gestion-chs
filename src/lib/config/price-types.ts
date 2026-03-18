export type PriceTypeKey = "nonato" | "tabela" | "plus25";

export interface PriceTypeConfig {
  key: PriceTypeKey;
  label: string;
  priceField: string;
  breakdownField: string;
  profitFormula: (venda: number, preco: number) => number;
  profitLabel: string;
  color: string;
  sheetTitle: string;
}

export const PRICE_TYPES: PriceTypeConfig[] = [
  {
    key: "nonato",
    label: "50/50",
    priceField: "preco_nonato",
    breakdownField: "custo_nonato_breakdown",
    profitFormula: (v, p) => (v - p) / 2,
    profitLabel: "Lucro 50/50",
    color: "violet",
    sheetTitle: "Custo 50/50",
  },
  {
    key: "tabela",
    label: "Tabela",
    priceField: "preco_tabela",
    breakdownField: "custo_tabela_breakdown",
    profitFormula: (v, p) => v - p,
    profitLabel: "Lucro Tabela",
    color: "amber",
    sheetTitle: "Custo Tabela",
  },
  {
    key: "plus25",
    label: "+25%",
    priceField: "preco_plus25",
    breakdownField: "custo_plus25_breakdown",
    profitFormula: (v, p) => v - p,
    profitLabel: "Lucro +25%",
    color: "rose",
    sheetTitle: "Custo +25%",
  },
];

export function getPriceType(key: PriceTypeKey): PriceTypeConfig {
  return PRICE_TYPES.find((pt) => pt.key === key)!;
}

// Color class mappings for dynamic Tailwind classes
export const PRICE_COLOR_CLASSES: Record<string, { text: string; border: string; bg: string; textLight: string }> = {
  violet: {
    text: "text-violet-500",
    textLight: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
  },
  amber: {
    text: "text-amber-500",
    textLight: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  rose: {
    text: "text-rose-500",
    textLight: "text-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/5",
  },
};
