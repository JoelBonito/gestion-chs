/**
 * Componentes de Loading Padronizados
 *
 * Uso:
 * import { PageLoader, ButtonLoader, CardSkeleton, TableSkeleton } from '@/components/ui/loading';
 */
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loader para páginas inteiras (usado em Suspense)
 */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <span className="text-muted-foreground text-sm">Carregando...</span>
      </div>
    </div>
  );
}

/**
 * Loader para botões
 */
export function ButtonLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {text}
    </>
  );
}

/**
 * Skeleton para cards
 */
export function CardSkeleton() {
  return (
    <div className="border-border bg-card space-y-3 rounded-lg border p-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton para tabelas
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="bg-muted/30 flex gap-4 rounded-lg p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-auto h-4 w-24" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-border/50 flex gap-4 border-b p-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para listas
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border-border/50 flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loader inline para textos
 */
export function InlineLoader() {
  return <Loader2 className="inline-block h-4 w-4 animate-spin" />;
}
