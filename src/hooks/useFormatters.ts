import { useLocale } from '@/contexts/LocaleContext';

export function useFormatters() {
  const { locale } = useLocale();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: locale === 'fr-FR' ? 'EUR' : 'EUR', // Both use EUR
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  };

  return { formatCurrency, formatDate };
}