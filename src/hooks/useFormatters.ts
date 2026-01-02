import { useLocale } from "@/contexts/LocaleContext";
import { formatCurrencyEUR } from "@/lib/utils/currency";

export function useFormatters() {
  const { locale } = useLocale();

  // Usar formatCurrencyEUR para consistência
  const formatCurrency = (value: number | null | undefined) => {
    return formatCurrencyEUR(value);
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
