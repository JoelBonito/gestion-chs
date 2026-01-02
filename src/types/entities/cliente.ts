/**
 * Tipos de Entidades - Cliente
 * Centralização dos tipos relacionados a clientes
 */

export interface Cliente {
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

export interface ClienteFormData {
    nome: string;
    email?: string;
    telefone?: string;
    morada?: string;
    nif?: string;
}

export interface ClienteWithStats extends Cliente {
    total_encomendas?: number;
    valor_total_gasto?: number;
}
