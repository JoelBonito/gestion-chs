// src/lib/permissions.ts
import { User } from '@supabase/supabase-js';

/**
 * Verifica se o usuário é Rosa - colaboradora sem preços
 */
export function isNoPriceUser(user: User | null): boolean {
  if (!user?.email) return false;
  return user.email.toLowerCase() === 'rosa@colaborador.com' || user.email.toLowerCase() === 'ham@admin.com';
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

/**
 * IDs dos fornecedores permitidos para Rosa
 */
export const ROSA_ALLOWED_SUPPLIERS = [
  'f0920a27-752c-4483-ba02-e7f32beceef6', // Brazil Multi Cosmetics
  'b8f995d2-47dc-4c8f-9779-ce21431f5244'  // Onl'us Beauty
];