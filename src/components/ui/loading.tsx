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
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
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
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {text}
        </>
    );
}

/**
 * Skeleton para cards
 */
export function CardSkeleton() {
    return (
        <div className="p-4 space-y-3 rounded-lg border border-border bg-card">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 mt-4">
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
            <div className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24 ml-auto" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-3 border-b border-border/50">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24 ml-auto" />
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
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
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
    return <Loader2 className="w-4 h-4 animate-spin inline-block" />;
}
