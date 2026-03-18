import { BRL_EUR_RATE } from "@/lib/utils/currency";

// Tax declaration table: weight (grams) → declared value (EUR)
const TAX_BRACKETS: { weight: number; declaredEur: number }[] = [
  { weight: 30, declaredEur: 0.30 },
  { weight: 50, declaredEur: 0.40 },
  { weight: 100, declaredEur: 0.50 },
  { weight: 200, declaredEur: 0.75 },
  { weight: 250, declaredEur: 0.75 },
  { weight: 300, declaredEur: 1.00 },
  { weight: 500, declaredEur: 1.50 },
  { weight: 1000, declaredEur: 2.50 },
];

/**
 * Find the closest tax bracket for a given weight in grams.
 * Uses the bracket with the smallest absolute difference.
 */
function findClosestBracket(weightGrams: number): (typeof TAX_BRACKETS)[0] {
  let closest = TAX_BRACKETS[0];
  let minDiff = Math.abs(weightGrams - closest.weight);

  for (const bracket of TAX_BRACKETS) {
    const diff = Math.abs(weightGrams - bracket.weight);
    if (diff < minDiff) {
      minDiff = diff;
      closest = bracket;
    }
  }

  return closest;
}

/** Frete SP: R$2 per kg */
export function calcularFreteSP(weightGrams: number): number {
  const kg = weightGrams / 1000;
  return Math.round(kg * 2 * 100) / 100;
}

/** Manuseio Carol: ≥500g → R$3, <500g → R$1.50 */
export function calcularManuseioCarol(weightGrams: number): number {
  return weightGrams >= 500 ? 3 : 1.5;
}

/** Imposto: 25% of declared EUR value × exchange rate */
export function calcularImposto(weightGrams: number, cotacao: number = BRL_EUR_RATE): number {
  const bracket = findClosestBracket(weightGrams);
  return Math.round(bracket.declaredEur * 0.25 * cotacao * 100) / 100;
}

/** All auto-calculated cost fields based on product weight */
export function calcularCustosAutomaticos(weightGrams: number): {
  frete_sp: number;
  manuseio_carol: number;
  imposto: number;
} {
  return {
    frete_sp: calcularFreteSP(weightGrams),
    manuseio_carol: calcularManuseioCarol(weightGrams),
    imposto: calcularImposto(weightGrams),
  };
}

/** Fields that are auto-calculated and should be read-only */
export const AUTO_CALCULATED_FIELDS: Set<string> = new Set([
  "frete_sp",
  "manuseio_carol",
  "imposto",
]);

/** Get a human-readable explanation of the auto-calculation */
export function getAutoCalcTooltip(key: string, weightGrams: number): string {
  const kg = weightGrams / 1000;
  switch (key) {
    case "frete_sp":
      return `${kg}kg × R$2/kg = R$${calcularFreteSP(weightGrams).toFixed(2)}`;
    case "manuseio_carol":
      return weightGrams >= 500
        ? `Peso ≥ 500g → R$3,00`
        : `Peso < 500g → R$1,50`;
    case "imposto": {
      const bracket = findClosestBracket(weightGrams);
      return `Declarar €${bracket.declaredEur.toFixed(2)} × 25% × ${BRL_EUR_RATE} = R$${calcularImposto(weightGrams).toFixed(2)}`;
    }
    default:
      return "";
  }
}
