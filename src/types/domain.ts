
export type Produto = {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  tamanho?: string | null;
  size_weight?: number | null;
  preco_custo: number;
  preco_venda: number;
  fornecedor_id?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Attachment = {
  id: string;
  entity_type: string; // Changed from literal union to string to match database
  entity_id: string;
  file_name: string;
  file_type: string;
  file_size?: number | null;
  storage_path: string;
  storage_url?: string | null;
  created_at: string;
  uploaded_by?: string | null;
};

export type Encomenda = {
  id: string;
  numero_encomenda: string;
  cliente_id: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  valor_frete?: number | null;
  status: 'pendente' | 'producao' | 'enviado' | 'entregue' | 'cancelado';
  created_at: string;
  updated_at?: string;
};

export type Cliente = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  created_at: string;
  updated_at?: string;
};

export type Fornecedor = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  created_at: string;
  updated_at?: string;
};
