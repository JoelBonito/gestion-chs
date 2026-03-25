// src/lib/utils/currency.ts
export type FormatEuroOptions = {
  withSymbol?: boolean; // default true
  fallback?: string; // default "—"
};

const EUR_NUMBER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true, // Garantir separador de milhar
});

export function formatCurrencyEUR(
  value: number | string | null | undefined,
  options: FormatEuroOptions = {}
): string {
  const { withSymbol = true, fallback = "—" } = options;

  if (value === null || value === undefined || value === ("" as any)) return fallback;

  let num: number;
  if (typeof value === "string") {
    const parsed = parseCurrencyEUR(value);
    if (parsed === null) return fallback;
    num = parsed;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    num = value;
  } else {
    return fallback;
  }

  const negative = num < 0;
  const abs = Math.abs(num);
  const numberPart = EUR_NUMBER.format(abs);
  const formatted = `${negative ? "-" : ""}${numberPart}${withSymbol ? "€" : ""}`;

  // Remover NBSP ou espaços acidentais antes do símbolo, se houver
  return formatted.replace(/\s+€$/, "€");
}

export function parseCurrencyEUR(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;

  const s = String(input).trim();
  if (!s) return null;

  // Mantém apenas dígitos, ponto, vírgula e sinal
  const cleaned = s.replace(/[^\d.,\-+]/g, "");

  // Se mais de um separador decimal (vírgula), trata a última vírgula como decimal
  // Estratégia: remove pontos (milhar), troca última vírgula por ponto
  const noThousands = cleaned.replace(/\./g, "");
  const normalized = noThousands.replace(/,([0-9]{1,2})$/, ".$1").replace(/,/g, "");

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

// BRL / EUR conversion (configurable rate)
export const BRL_EUR_RATE = 6; // default fallback: 1 EUR = 6 BRL

let currentRate: number = BRL_EUR_RATE;

export function setExchangeRate(rate: number): void {
  if (rate > 0 && Number.isFinite(rate)) {
    currentRate = rate;
  }
}

export function getExchangeRate(): number {
  return currentRate;
}

/**
 * Loads exchange rate from `app_config` table in Supabase.
 * Falls back to BRL_EUR_RATE if not found or on error.
 */
export async function fetchExchangeRate(): Promise<number> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "brl_eur_rate")
      .maybeSingle();

    if (error || !data?.value) {
      return currentRate;
    }

    // Handle both {"rate": 6} (JSONB object) and "6" (plain number) formats
    const raw = data.value;
    const parsed = typeof raw === "object" && raw !== null && "rate" in raw
      ? Number((raw as { rate: number }).rate)
      : Number(raw);
    if (parsed > 0 && Number.isFinite(parsed)) {
      currentRate = parsed;
      return currentRate;
    }
  } catch {
    // Fallback silently
  }
  return currentRate;
}

/**
 * Saves exchange rate to `app_config` table in Supabase.
 */
export async function updateExchangeRate(rate: number): Promise<boolean> {
  if (!(rate > 0 && Number.isFinite(rate))) return false;

  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase
      .from("app_config")
      .upsert({ key: "brl_eur_rate", value: { rate } as unknown as string, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) return false;

    currentRate = rate;
    return true;
  } catch {
    return false;
  }
}

export function brlToEur(brl: number): number {
  return brl / currentRate;
}

export function eurToBrl(eur: number): number {
  return eur * currentRate;
}

const BRL_NUMBER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

export function formatCurrencyBRL(
  value: number | null | undefined,
  fallback = "—"
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  const negative = value < 0;
  const abs = Math.abs(value);
  return `${negative ? "-" : ""}R$ ${BRL_NUMBER.format(abs)}`;
}
