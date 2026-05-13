import { LinhaFatura, TotaisFatura, ResumoIvaItem } from './types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcularSubtotalLinha(linha: Omit<LinhaFatura, 'subtotal'>): number {
  const bruto = linha.preco * linha.qtd;
  const comDesconto = bruto * (1 - linha.desconto / 100);
  const comIva = comDesconto * (1 + linha.iva / 100);
  return round2(comIva);
}

export function calcularTotais(linhas: LinhaFatura[]): TotaisFatura {
  let subtotal_sem_iva = 0;
  let desconto_comercial = 0;
  let total_iva = 0;

  for (const linha of linhas) {
    const bruto = linha.preco * linha.qtd;
    const descontoValor = bruto * (linha.desconto / 100);
    const baseAposDesconto = bruto - descontoValor;
    const ivaValor = baseAposDesconto * (linha.iva / 100);

    subtotal_sem_iva += bruto;
    desconto_comercial += descontoValor;
    total_iva += ivaValor;
  }

  const total_sem_iva = subtotal_sem_iva - desconto_comercial;
  const total_pagar = total_sem_iva + total_iva;

  return {
    subtotal_sem_iva: round2(subtotal_sem_iva),
    desconto_comercial: round2(desconto_comercial),
    desconto_financeiro: 0,
    total_sem_iva: round2(total_sem_iva),
    total_iva: round2(total_iva),
    total_pagar: round2(total_pagar),
  };
}

export function calcularResumoIva(linhas: LinhaFatura[]): ResumoIvaItem[] {
  const mapa = new Map<number, number>();
  for (const linha of linhas) {
    const bruto = linha.preco * linha.qtd;
    const baseAposDesconto = bruto * (1 - linha.desconto / 100);
    const ivaValor = baseAposDesconto * (linha.iva / 100);
    mapa.set(linha.iva, (mapa.get(linha.iva) ?? 0) + ivaValor);
  }
  return Array.from(mapa.entries())
    .map(([taxa, valor]) => ({ taxa, valor: round2(valor) }))
    .sort((a, b) => a.taxa - b.taxa);
}
