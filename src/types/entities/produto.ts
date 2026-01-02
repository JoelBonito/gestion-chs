/**
 * Tipos de Entidades - Produto
 * Centralização dos tipos relacionados a produtos
 */

export interface Produto {
    id: string;
    nome: string;
    marca?: string | null;
    tipo?: string | null;
    referencia?: string | null;
    preco_venda?: number | null;
    preco_custo?: number | null;
    stock_atual?: number | null;
    stock_minimo?: number | null;
    ativo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProdutoFormData {
    nome: string;
    marca?: string;
    tipo?: string;
    referencia?: string;
    preco_venda?: number;
    preco_custo?: number;
    stock_atual?: number;
    stock_minimo?: number;
}

export interface ProdutoWithStats extends Produto {
    total_vendido?: number;
    receita_total?: number;
}
