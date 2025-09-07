// src/lib/utils/currency.ts
export type FormatEuroOptions = {
  withSymbol?: boolean; // default true
  fallback?: string;    // default "—"
};

const EUR_NUMBER = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyEUR(
  value: number | string | null | undefined,
  options: FormatEuroOptions = {}
): string {
  const { withSymbol = true, fallback = '—' } = options;
  
  if (value === null || value === undefined || value === '' as any) return fallback;
  
  let num: number;
  if (typeof value === 'string') {
    const parsed = parseCurrencyEUR(value);
    if (parsed === null) return fallback;
    num = parsed;
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    num = value;
  } else {
    return fallback;
  }
  
  const negative = num < 0;
  const abs = Math.abs(num);
  const numberPart = EUR_NUMBER.format(abs);
  const formatted = `${negative ? '-' : ''}${numberPart}${withSymbol ? '€' : ''}`;
  
  // Remover NBSP ou espaços acidentais antes do símbolo, se houver
  return formatted.replace(/\s+€$/, '€');
}

export function parseCurrencyEUR(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  
  const s = String(input).trim();
  if (!s) return null;
  
  // Mantém apenas dígitos, ponto, vírgula e sinal
  const cleaned = s.replace(/[^\d.,\-+]/g, '');
  
  // Se mais de um separador decimal (vírgula), trata a última vírgula como decimal
  // Estratégia: remove pontos (milhar), troca última vírgula por ponto
  const noThousands = cleaned.replace(/\./g, '');
  const normalized = noThousands.replace(/,([0-9]{1,2})$/, '.$1').replace(/,/g, '');
  
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}