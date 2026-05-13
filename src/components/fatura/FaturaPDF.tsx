import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { EMISSOR_FATURA_LEGACY, EMISSOR_FATURA_INV } from '@/lib/fatura/emissor';
import { formatCurrencyEUR, formatCurrencyBRL } from '@/lib/utils/currency';
import type { FaturaCompleta, LinhaFatura, ResumoIvaItem } from '@/lib/fatura/types';

const COLORS = {
  text: '#1F2937',
  muted: '#6B7280',
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  black: '#000000',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logo: {
    width: 90,
    objectFit: 'contain',
  },
  topRight: {
    alignItems: 'flex-end',
  },
  topRightLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  topRightNumber: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
    marginBottom: 2,
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  partyBlock: {
    flex: 1,
    padding: 8,
  },
  partyBlockBordered: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  partyLabel: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: COLORS.text,
  },
  metaStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    marginBottom: 16,
  },
  metaCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  metaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    color: COLORS.text,
  },
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 6,
    paddingTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 6,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.text,
  },
  td: {
    fontSize: 9,
    color: COLORS.text,
  },
  colDesc: { width: '40%', paddingRight: 4 },
  colPreco: { width: '12%', textAlign: 'right' },
  colQtd: { width: '8%', textAlign: 'right' },
  colUnid: { width: '10%', textAlign: 'center' },
  colDesc2: { width: '9%', textAlign: 'right' },
  colIva: { width: '8%', textAlign: 'right' },
  colSubtotal: { width: '13%', textAlign: 'right' },
  notasIsencao: {
    marginTop: 6,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  notaIsencao: {
    fontSize: 8,
    color: COLORS.muted,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  totalsCol: {
    flex: 1,
  },
  totalsTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 6,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 9,
    color: COLORS.text,
  },
  totalPagarLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: COLORS.black,
  },
  totalPagarLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.black,
  },
  totalPagarValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.black,
  },
  conversionBox: {
    marginTop: 8,
    padding: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  conversionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  conversionLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  conversionLabel: {
    fontSize: 8,
    color: COLORS.muted,
  },
  conversionValue: {
    fontSize: 8,
    color: COLORS.text,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
  },
  footerNote: {
    fontSize: 7,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 6,
  },
  footerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerMetaText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
  },
});

const formatDatePT = (iso: string): string => new Date(iso).toLocaleDateString('pt-PT');
const formatDateEN = (iso: string): string => new Date(iso).toLocaleDateString('en-GB');

const formatEUR = (v: number): string => formatCurrencyEUR(v);
const formatPct = (v: number): string => `${v.toFixed(2).replace('.', ',')}%`;
const formatQtd = (v: number): string => {
  const isInteger = Number.isInteger(v);
  return isInteger ? String(v) : v.toFixed(2).replace('.', ',');
};

interface FaturaPDFProps {
  fatura: FaturaCompleta;
}

export function FaturaPDF({ fatura }: FaturaPDFProps): JSX.Element {
  const isInv = fatura.numero_serie === 'INV';
  return isInv ? <FaturaPDFInv fatura={fatura} /> : <FaturaPDFLegacy fatura={fatura} />;
}

function FaturaPDFLegacy({ fatura }: FaturaPDFProps): JSX.Element {
  const E = EMISSOR_FATURA_LEGACY;
  const { snapshot_cliente, linhas, totais, resumo_iva } = fatura;
  const linhasComNota = linhas.filter((l) => l.nota_isencao && l.nota_isencao.trim().length > 0);
  const nomeCliente = snapshot_cliente.nome_social ?? snapshot_cliente.nome;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <Image src={E.logo_path} style={styles.logo} />
          <View style={styles.topRight}>
            <Text style={styles.topRightLabel}>Fatura</Text>
            <Text style={styles.topRightNumber}>{fatura.numero_completo}</Text>
            <Text style={styles.topRightLabel}>Original</Text>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>De:</Text>
            <Text style={styles.partyName}>{E.nome}</Text>
            <Text style={styles.partyLine}>{E.morada}</Text>
            <Text style={styles.partyLine}>{E.codigo_postal} {E.cidade} | {E.pais}</Text>
            <Text style={styles.partyLine}>NIF: {E.nif}</Text>
            <Text style={styles.partyLine}>Tel: {E.telefone}</Text>
            <Text style={styles.partyLine}>{E.email}</Text>
          </View>

          <View style={styles.partyBlockBordered}>
            <Text style={styles.partyLabel}>Para:</Text>
            {snapshot_cliente.codigo_cliente ? (
              <Text style={styles.partyLine}>Cód.: {snapshot_cliente.codigo_cliente}</Text>
            ) : null}
            <Text style={styles.partyName}>{nomeCliente}</Text>
            {snapshot_cliente.endereco ? <Text style={styles.partyLine}>{snapshot_cliente.endereco}</Text> : null}
            {snapshot_cliente.codigo_postal || snapshot_cliente.cidade ? (
              <Text style={styles.partyLine}>
                {[snapshot_cliente.codigo_postal, snapshot_cliente.cidade].filter(Boolean).join(' ')}
              </Text>
            ) : null}
            {snapshot_cliente.pais ? <Text style={styles.partyLine}>{snapshot_cliente.pais}</Text> : null}
          </View>
        </View>

        <View style={styles.metaStrip}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Data de Emissão</Text>
            <Text style={styles.metaValue}>{formatDatePT(fatura.data_emissao)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Condições de Pagamento</Text>
            <Text style={styles.metaValue}>{fatura.condicoes_pagamento}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Data de Vencimento</Text>
            <Text style={styles.metaValue}>{formatDatePT(fatura.data_vencimento)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>NIF</Text>
            <Text style={styles.metaValue}>{snapshot_cliente.nif ?? '-'}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Moeda</Text>
            <Text style={styles.metaValue}>{fatura.moeda}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Descrição</Text>
            <Text style={[styles.th, styles.colPreco]}>Preço</Text>
            <Text style={[styles.th, styles.colQtd]}>Qtd</Text>
            <Text style={[styles.th, styles.colUnid]}>Unidade</Text>
            <Text style={[styles.th, styles.colDesc2]}>Desconto</Text>
            <Text style={[styles.th, styles.colIva]}>IVA</Text>
            <Text style={[styles.th, styles.colSubtotal]}>Subtotal c/IVA</Text>
          </View>
          {linhas.map((linha: LinhaFatura, idx: number) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colDesc]}>{linha.descricao}</Text>
              <Text style={[styles.td, styles.colPreco]}>{formatEUR(linha.preco)}</Text>
              <Text style={[styles.td, styles.colQtd]}>{formatQtd(linha.qtd)}</Text>
              <Text style={[styles.td, styles.colUnid]}>{linha.unidade}</Text>
              <Text style={[styles.td, styles.colDesc2]}>{formatPct(linha.desconto)}</Text>
              <Text style={[styles.td, styles.colIva]}>{formatPct(linha.iva)}</Text>
              <Text style={[styles.td, styles.colSubtotal]}>{formatEUR(linha.subtotal)}</Text>
            </View>
          ))}
        </View>

        {linhasComNota.length > 0 ? (
          <View style={styles.notasIsencao}>
            {linhasComNota.map((linha, idx) => (
              <Text key={idx} style={styles.notaIsencao}>*{linha.nota_isencao}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.totalsRow}>
          <View style={styles.totalsCol}>
            <Text style={styles.totalsTitle}>IVA</Text>
            {resumo_iva.map((item: ResumoIvaItem, idx: number) => (
              <View key={idx} style={styles.totalLine}>
                <Text style={styles.totalLabel}>IVA {formatPct(item.taxa)}</Text>
                <Text style={styles.totalValue}>{formatEUR(item.valor)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsCol}>
            <Text style={styles.totalsTitle}>Resumo</Text>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal sem IVA</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.subtotal_sem_iva)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Desconto Comercial</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.desconto_comercial)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Desconto Financeiro</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.desconto_financeiro)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total sem IVA</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.total_sem_iva)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total IVA</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.total_iva)}</Text>
            </View>
            <View style={styles.totalPagarLine}>
              <Text style={styles.totalPagarLabel}>Total a Pagar</Text>
              <Text style={styles.totalPagarValue}>{formatEUR(totais.total_pagar)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerNote}>
            Os artigos mencionados foram colocados à disposição do adquirente nesta data (Alínea f do nº5 - Art. 36 do C/IVA)
          </Text>
          <View style={styles.footerMeta}>
            <Text style={styles.footerMetaText}>Processado por Programa Certificado</Text>
            <Text
              style={styles.footerMetaText}
              render={({ pageNumber, totalPages }) => `Página: ${pageNumber} de ${totalPages}`}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}

function FaturaPDFInv({ fatura }: FaturaPDFProps): JSX.Element {
  const E = EMISSOR_FATURA_INV;
  const { snapshot_cliente, linhas, totais, resumo_iva, conversao_brl } = fatura;
  const linhasComNota = linhas.filter((l) => l.nota_isencao && l.nota_isencao.trim().length > 0);
  const nomeCliente = snapshot_cliente.nome_social ?? snapshot_cliente.nome;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <Image src={E.logo_path} style={styles.logo} />
          <View style={styles.topRight}>
            <Text style={styles.topRightLabel}>INVOICE</Text>
            <Text style={styles.topRightNumber}>{fatura.numero_completo}</Text>
            <Text style={styles.topRightLabel}>Original</Text>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>From:</Text>
            <Text style={styles.partyName}>{E.nome}</Text>
            <Text style={styles.partyLine}>{E.morada}</Text>
            <Text style={styles.partyLine}>{E.codigo_postal} {E.cidade}</Text>
            <Text style={styles.partyLine}>{E.estado}, {E.pais}</Text>
            <Text style={styles.partyLine}>CNPJ: {E.cnpj}</Text>
            <Text style={styles.partyLine}>Phone: {E.telefone}</Text>
            <Text style={styles.partyLine}>{E.email}</Text>
          </View>

          <View style={styles.partyBlockBordered}>
            <Text style={styles.partyLabel}>Bill to:</Text>
            {snapshot_cliente.codigo_cliente ? (
              <Text style={styles.partyLine}>Code: {snapshot_cliente.codigo_cliente}</Text>
            ) : null}
            <Text style={styles.partyName}>{nomeCliente}</Text>
            {snapshot_cliente.endereco ? <Text style={styles.partyLine}>{snapshot_cliente.endereco}</Text> : null}
            {snapshot_cliente.codigo_postal || snapshot_cliente.cidade ? (
              <Text style={styles.partyLine}>
                {[snapshot_cliente.codigo_postal, snapshot_cliente.cidade].filter(Boolean).join(' ')}
              </Text>
            ) : null}
            {snapshot_cliente.pais ? <Text style={styles.partyLine}>{snapshot_cliente.pais}</Text> : null}
          </View>
        </View>

        <View style={styles.metaStrip}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{formatDateEN(fatura.data_emissao)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Payment Terms</Text>
            <Text style={styles.metaValue}>{fatura.condicoes_pagamento}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{formatDateEN(fatura.data_vencimento)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Tax ID</Text>
            <Text style={styles.metaValue}>{snapshot_cliente.nif ?? '-'}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Currency</Text>
            <Text style={styles.metaValue}>{fatura.moeda}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colPreco]}>Price</Text>
            <Text style={[styles.th, styles.colQtd]}>Qty</Text>
            <Text style={[styles.th, styles.colUnid]}>Unit</Text>
            <Text style={[styles.th, styles.colDesc2]}>Discount</Text>
            <Text style={[styles.th, styles.colIva]}>VAT</Text>
            <Text style={[styles.th, styles.colSubtotal]}>Subtotal incl. VAT</Text>
          </View>
          {linhas.map((linha: LinhaFatura, idx: number) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colDesc]}>{linha.descricao}</Text>
              <Text style={[styles.td, styles.colPreco]}>{formatEUR(linha.preco)}</Text>
              <Text style={[styles.td, styles.colQtd]}>{formatQtd(linha.qtd)}</Text>
              <Text style={[styles.td, styles.colUnid]}>{linha.unidade}</Text>
              <Text style={[styles.td, styles.colDesc2]}>{formatPct(linha.desconto)}</Text>
              <Text style={[styles.td, styles.colIva]}>{formatPct(linha.iva)}</Text>
              <Text style={[styles.td, styles.colSubtotal]}>{formatEUR(linha.subtotal)}</Text>
            </View>
          ))}
        </View>

        {linhasComNota.length > 0 ? (
          <View style={styles.notasIsencao}>
            {linhasComNota.map((linha, idx) => (
              <Text key={idx} style={styles.notaIsencao}>*{linha.nota_isencao}</Text>
            ))}
          </View>
        ) : null}

        <View style={styles.totalsRow}>
          <View style={styles.totalsCol}>
            <Text style={styles.totalsTitle}>VAT</Text>
            {resumo_iva.map((item: ResumoIvaItem, idx: number) => (
              <View key={idx} style={styles.totalLine}>
                <Text style={styles.totalLabel}>VAT {formatPct(item.taxa)}</Text>
                <Text style={styles.totalValue}>{formatEUR(item.valor)}</Text>
              </View>
            ))}

            {conversao_brl ? (
              <View style={styles.conversionBox}>
                <Text style={styles.conversionTitle}>BRL Conversion</Text>
                <View style={styles.conversionLine}>
                  <Text style={styles.conversionLabel}>Exchange Rate (EUR/BRL)</Text>
                  <Text style={styles.conversionValue}>
                    {conversao_brl.taxa.toFixed(4).replace('.', ',')}
                  </Text>
                </View>
                <View style={styles.conversionLine}>
                  <Text style={styles.conversionLabel}>Quote Date</Text>
                  <Text style={styles.conversionValue}>{formatDateEN(conversao_brl.data_cotacao)}</Text>
                </View>
                <View style={styles.conversionLine}>
                  <Text style={styles.conversionLabel}>Source</Text>
                  <Text style={styles.conversionValue}>{conversao_brl.fonte}</Text>
                </View>
                <View style={styles.conversionLine}>
                  <Text style={styles.conversionLabel}>Total in BRL</Text>
                  <Text style={[styles.conversionValue, { fontFamily: 'Helvetica-Bold' }]}>
                    {formatCurrencyBRL(conversao_brl.total_brl)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.totalsCol}>
            <Text style={styles.totalsTitle}>Summary</Text>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal excl. VAT</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.subtotal_sem_iva)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Trade Discount</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.desconto_comercial)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Financial Discount</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.desconto_financeiro)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total excl. VAT</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.total_sem_iva)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total VAT</Text>
              <Text style={styles.totalValue}>{formatEUR(totais.total_iva)}</Text>
            </View>
            <View style={styles.totalPagarLine}>
              <Text style={styles.totalPagarLabel}>Total Due</Text>
              <Text style={styles.totalPagarValue}>{formatEUR(totais.total_pagar)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerNote}>
            This is a commercial invoice for international services. It does not replace a Brazilian Nota Fiscal Eletrônica (NF-e), which is issued separately when applicable.
          </Text>
          <View style={styles.footerMeta}>
            <Text style={styles.footerMetaText}>Inove AI</Text>
            <Text
              style={styles.footerMetaText}
              render={({ pageNumber, totalPages }) => `Page: ${pageNumber} of ${totalPages}`}
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
