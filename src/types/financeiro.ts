
export type EncomendaFinanceiro = {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;          // produtos apenas
  valor_pago: number;
  saldo_devedor: number;        // produtos apenas (manter compatibilidade)
  freight_rates: number;        // frete
  total_caixa: number;          // produtos + frete
  saldo_devedor_caixa: number;  // total_caixa - pago
};

export type ContaPagar = {
  id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  custo_produtos: number;       // Custo calculado dos produtos
  valor_pago_fornecedor: number;
  freight_rates: number;        // Frete
  total_caixa_pagar: number;    // Custo + Frete
  saldo_pagar_caixa: number;    // Total Caixa - Valor Pago
};
