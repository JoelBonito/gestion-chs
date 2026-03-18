export interface CustoBreakdown {
  embalagem: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  manuseio_carol: number;
  imposto: number;
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
