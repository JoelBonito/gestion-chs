// src/lib/permissions.ts
import { User } from '@supabase/supabase-js';

/**
 * Verifica se o usuário é Rosa - colaboradora sem preços
 */
export function isNoPriceUser(user: User | null): boolean {
  if (!user?.email) return false;
  return user.email.toLowerCase() === 'rosa@colaborador.com';
}

/**
 * Verifica se o usuário tem navegação limitada (Rosa)
 */
export function isLimitedNav(user: User | null): boolean {
  return isNoPriceUser(user);
}

/**
 * Verifica se o usuário tem permissões apenas de leitura para encomendas (Rosa)
 */
export function isReadonlyOrders(user: User | null): boolean {
  return isNoPriceUser(user);
}

/**
 * Verifica se deve ocultar preços para o usuário (Rosa)
 */
export function shouldHidePrices(user: User | null): boolean {
  return isNoPriceUser(user);
}