/**
 * Tipos de Entidades - Fornecedor
 * Centralização dos tipos relacionados a fornecedores
 */

export interface Fornecedor {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    morada?: string | null;
    nif?: string | null;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface FornecedorFormData {
    nome: string;
    email?: string;
    telefone?: string;
    morada?: string;
    nif?: string;
}

export interface FornecedorWithStats extends Fornecedor {
    total_encomendas?: number;
    valor_total_compras?: number;
}
