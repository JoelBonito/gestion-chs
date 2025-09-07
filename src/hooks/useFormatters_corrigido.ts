export function useFormatters() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + "€"; // força formato 8.500,00€
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("pt-PT").format(new Date(date));
  };

  return { formatCurrency, formatDate };
}
