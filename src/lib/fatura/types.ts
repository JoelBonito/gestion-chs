export interface LinhaFatura {
  uid: string;
  produto_id: string | null;
  descricao: string;
  preco: number;
  qtd: number;
  unidade: string;
  desconto: number;
  iva: number;
  nota_isencao: string | null;
  subtotal: number;
}

export interface TotaisFatura {
  subtotal_sem_iva: number;
  desconto_comercial: number;
  desconto_financeiro: number;
  total_sem_iva: number;
  total_iva: number;
  total_pagar: number;
}

export interface ResumoIvaItem {
  taxa: number;
  valor: number;
}

export interface SnapshotCliente {
  nome: string;
  nome_social: string | null;
  nif: string | null;
  codigo_cliente: string | null;
  endereco: string | null;
  codigo_postal: string | null;
  cidade: string | null;
  pais: string | null;
}

import type { Json } from "@/integrations/supabase/types";

export const toJson = <T>(v: T): Json => v as unknown as Json;

export interface ConversaoBRL {
  taxa: number;
  data_cotacao: string;
  fonte: string;
  total_brl: number;
}

export interface FaturaCompleta {
  numero_serie: string;
  ano: number;
  sequencia: number;
  numero_completo: string;
  cliente_id: string | null;
  snapshot_cliente: SnapshotCliente;
  data_emissao: string;
  data_vencimento: string;
  condicoes_pagamento: string;
  moeda: string;
  linhas: LinhaFatura[];
  totais: TotaisFatura;
  resumo_iva: ResumoIvaItem[];
  conversao_brl?: ConversaoBRL | null;
}
