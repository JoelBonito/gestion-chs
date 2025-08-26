
export type EncomendaFinanceiro = {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;        // Produtos
  valor_pago: number;
  saldo_devedor: number;
  valor_frete?: number;       // Frete
  total_caixa?: number;       // Produtos + Frete
  saldo_devedor_caixa?: number; // Total Caixa - Valor Pago
};
