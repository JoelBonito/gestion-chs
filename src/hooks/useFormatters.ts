// src/hooks/useFormatters.ts
export function useFormatters() {
  /**
   * Formata valores monetários em Euro, padrão PT-BR/Portugal
   * Ex: 8500 -> "8.500,00 €"
   */
  const formatCurrencyEUR = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "0,00 €";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  /**
   * Formata datas para padrão PT-PT
   * Ex: 2025-09-08T12:00:00Z -> "08/09/2025"
   */
  const formatDate = (dateLike?: string | Date | null) => {
    if (!dateLike) return "—";
    try {
      const d = new Date(dateLike);
      return new Intl.DateTimeFormat("pt-PT").format(d);
    } catch {
      return "—";
    }
  };

  /**
   * Formata peso (kg)
   * Ex: 1115.4 -> "1.115,40 kg"
   */
  const formatWeight = (value: number | null | undefined) => {
    if (!value) return "0 kg";
    return `${new Intl.NumberFormat("pt-PT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} kg`;
  };

  /**
   * Formata número genérico
   * Ex: 1234567 -> "1.234.567"
   */
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "0";
    return new Intl.NumberFormat("pt-PT").format(value);
  };

  return {
    formatCurrencyEUR,
    formatDate,
    formatWeight,
    formatNumber,
  };
}
