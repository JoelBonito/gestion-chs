

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
  estoque_garrafas?: number;
  estoque_tampas?: number;
  estoque_rotulos?: number;
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
