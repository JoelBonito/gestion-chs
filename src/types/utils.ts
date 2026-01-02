/**
 * Tipos utilitários para TypeScript
 */

/**
 * Tipo para erros genéricos (substitui `: any` em catch blocks)
 * Uso: catch (error) { const err = getErrorMessage(error); }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Erro desconhecido";
}

/**
 * Type guard para verificar se é um Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Tipo para respostas de API do Supabase
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Tipo para callbacks de sucesso
 */
export type SuccessCallback = () => void;

/**
 * Tipo para handlers de mudança genéricos
 */
export type ChangeHandler<T> = (value: T) => void;

/**
 * Tipo para identificadores UUID
 */
export type UUID = string;

/**
 * Tipo parcial profundo
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Faz todas as propriedades obrigatórias
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Remove propriedades undefined de um objeto
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
