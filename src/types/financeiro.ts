
export type EncomendaFinanceiro = {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;          // produtos
  valor_pago: number;
  saldo_devedor: number;        // produtos
  valor_frete: number;          // freight_rates
  total_caixa: number;          // produtos + frete
  saldo_devedor_caixa: number;  // total_caixa - pago
};

export type ContaPagar = {
  id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  valor_total_custo: number;      // Custo dos produtos
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  valor_frete: number;           // Frete
  total_fornecedor: number;      // Custo + Frete
  saldo_devedor_fornecedor_total: number; // Total Fornecedor - Valor Pago
};
