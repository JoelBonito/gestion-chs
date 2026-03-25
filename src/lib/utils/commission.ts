import { FORNECEDOR_PRODUCAO_ID } from "@/lib/permissions";

export const EXCLUDED_ORDERS = new Set(["ENC017", "ENC013", "ENC012"]);

export interface CommissionItem {
  quantidade: number;
  preco_unitario: number;
  preco_custo: number;
  lucro_joel?: number | null;
  lucro_joel_real?: number | null;
  fornecedor_id?: string;
}

export interface CommissionContext {
  numero_encomenda: string;
  status: string;
  fornecedor_id?: string;
}

export function calcularComissaoItem(
  item: CommissionItem,
  context: CommissionContext
): number {
  const qty = item.quantidade || 0;

  // Bonification items (preco_venda = 0) have no commission
  if (!item.preco_unitario || item.preco_unitario <= 0) {
    return 0;
  }

  // Excluded orders: keep old logic
  if (EXCLUDED_ORDERS.has(context.numero_encomenda) || context.status === "ENTREGUE") {
    return qty * item.preco_unitario - qty * item.preco_custo;
  }

  const isOnlus = (item.fornecedor_id || context.fornecedor_id) === FORNECEDOR_PRODUCAO_ID;

  if (!isOnlus) {
    return qty * item.preco_unitario - qty * item.preco_custo;
  }

  // ONL'US: use real cost if filled
  if (item.lucro_joel_real != null && item.lucro_joel_real > 0) {
    return qty * item.lucro_joel_real;
  }

  // ONL'US: use product lucro_joel as default
  if (item.lucro_joel != null && item.lucro_joel > 0) {
    return qty * item.lucro_joel;
  }

  // Fallback
  return qty * item.preco_unitario - qty * item.preco_custo;
}
