import { useLocale } from '@/contexts/LocaleContext';

export function useFormatters() {
  const { locale } = useLocale();

  /**
   * Formata valores em EUR.
   * - Locale: usa 'fr-FR' quando definido; demais caem em 'pt-PT'
   * - Separador de milhar: '.'
   * - Separador decimal: ','
   * - Símbolo do euro SEM espaço: 8.500,00€
   */
  const formatCurrency = (amount: number): string => {
    const localeToUse = locale === 'fr-FR' ? 'fr-FR' : 'pt-PT';
    const formatted = new Intl.NumberFormat(localeToUse, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    // Remove qualquer espaço (inclusive NBSP) antes do símbolo €
    return formatted.replace(/\s*€/, '€');
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === 'fr-FR' ? 'fr-FR' : 'pt-PT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  };

  return { formatCurrency, formatDate };
}
