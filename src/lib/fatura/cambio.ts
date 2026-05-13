interface BcbCotacao {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

interface BcbResponse {
  value: BcbCotacao[];
}

export interface TaxaCambioBRL {
  taxa: number;
  data_cotacao: string;
  data_solicitada: string;
  fonte: string;
}

function formatDateBCB(iso: string): string {
  const [yyyy, mm, dd] = iso.split('-');
  return `${mm}-${dd}-${yyyy}`;
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

async function fetchPtaxEur(dataIso: string): Promise<BcbCotacao | null> {
  const dataBcb = formatDateBCB(dataIso);
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='EUR'&@dataCotacao='${dataBcb}'&$top=1&$format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as BcbResponse;
    return json.value?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getTaxaEurBrl(dataEmissaoIso: string): Promise<TaxaCambioBRL> {
  let tentativa = dataEmissaoIso;
  for (let i = 0; i < 7; i++) {
    const cot = await fetchPtaxEur(tentativa);
    if (cot && cot.cotacaoVenda > 0) {
      return {
        taxa: cot.cotacaoVenda,
        data_cotacao: cot.dataHoraCotacao.split(' ')[0] ?? tentativa,
        data_solicitada: dataEmissaoIso,
        fonte: 'BCB PTAX (venda)',
      };
    }
    tentativa = shiftDate(tentativa, -1);
  }
  throw new Error('Não foi possível obter taxa de câmbio BCB PTAX EUR para a data informada.');
}
