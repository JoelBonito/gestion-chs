import { useLocale } from '@/contexts/LocaleContext';

export function useFormatters() {
  const { locale } = useLocale();

  // Corrigido: sempre usar formato pt-PT para moeda EUR
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return "0,00€";
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale || "pt-PT").format(d);
  };

  const formatDateTime = (date: string | Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale || "pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  return {
    formatCurrency,
    formatDate,
    formatDateTime,
  };
}
