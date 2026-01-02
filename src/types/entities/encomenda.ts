/**
 * Tipos de Entidades - Encomenda
 * Centralização dos tipos relacionados a encomendas
 */

export type StatusEncomenda =
    | "NOVO PEDIDO"
    | "MATÉRIA PRIMA"
    | "PRODUÇÃO"
    | "EMBALAGENS"
    | "TRANSPORTE"
    | "ENTREGUE";

export interface Encomenda {
    id: string;
    numero_encomenda: string;
    status: StatusEncomenda;
    valor_total: number;
    valor_pago: number;
    saldo_devedor: number;
    valor_total_custo: number;
    valor_pago_fornecedor: number;
    saldo_devedor_fornecedor: number;
    valor_frete?: number | null;
    data_criacao: string;
    data_producao_estimada?: string | null;
    data_entrega?: string | null;
    cliente_id: string;
    fornecedor_id: string;
    etiqueta?: string | null;
    observacoes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface EncomendaFormData {
    numero_encomenda: string;
    cliente_id: string;
    fornecedor_id: string;
    status: StatusEncomenda;
    data_producao_estimada?: string;
    data_entrega?: string;
    valor_frete?: number;
    etiqueta?: string;
    observacoes?: string;
}

export interface EncomendaWithRelations extends Encomenda {
    clientes?: { nome: string };
    fornecedores?: { nome: string };
}

export interface ItemEncomenda {
    id: string;
    encomenda_id: string;
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    preco_custo: number;
    subtotal: number;
    produtos?: {
        nome: string;
        marca?: string;
        tipo?: string;
    };
}
