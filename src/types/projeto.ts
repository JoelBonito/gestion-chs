export interface Projeto {
  id: string;
  nome: string;
  observacoes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status?: 'ativo' | 'arquivado';
}