export interface CustoBreakdown {
  garrafa: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  embalagem_carol: number;
  imposto: number;
  diversos: number;
}

export interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_venda: number;
  preco_custo: number;
  ativo: boolean;
  size_weight: number;
  fornecedor_id: string;
  created_at: string;
  updated_at: string;
  imagem_url?: string | null;
  descricao?: string | null;
  // 50/50 pricing
  preco_nonato?: number | null;
  custo_nonato_breakdown?: CustoBreakdown | null;
  // Tabela pricing
  preco_tabela?: number | null;
  custo_tabela_breakdown?: CustoBreakdown | null;
  // +25% pricing
  preco_plus25?: number | null;
  custo_plus25_breakdown?: CustoBreakdown | null;
  estoque_garrafas?: number;
  estoque_tampas?: number;
  estoque_rotulos?: number;
  new_product?: boolean;
  peso?: number;
  // New pricing model
  custo_producao?: number | null;
  lucro_joel?: number | null;
  garrafa_incluso?: boolean;
  tampa_incluso?: boolean;
}

export interface CustoProducaoEncomenda {
  id?: string;
  encomenda_id: string;
  item_encomenda_id: string;
  produto_id: string;
  garrafa: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  embalagem_carol: number;
  imposto: number;
  diversos: number;
  custo_total_brl: number;
  custo_total_eur: number;
  lucro_joel_real: number;
  garrafa_incluso?: boolean;
  tampa_incluso?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  contato?: string | null;
  observacoes?: string | null;
  active: boolean;
  catalog_url?: string | null;
  catalog_file?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  contato?: string | null;
  observacoes?: string | null;
  active: boolean;
  created_at: string;
  updated_at?: string | null;
}
