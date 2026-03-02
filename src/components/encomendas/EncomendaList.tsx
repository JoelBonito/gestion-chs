import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { EncomendaCard } from "./EncomendaCard";

interface EncomendaListProps {
    loading: boolean;
    encomendas: any[];
    onView: (e: any) => void;
    onEdit: (e: any) => void;
    onDelete: (id: string) => void;
    onTransport: (e: any) => void;
    onStatusChange: () => void;
    onDateUpdate: (id: string, field: string, value: string) => void;
    // Permissions
    canEditOrders: boolean;
    canEditProduction: boolean;
    canEditDelivery: boolean;
    hidePrices: boolean;
    isHam: boolean;
    // i18n
    t: any;
    // Formatters
    formatCurrency: (v: number) => string;
    formatDate: (d: string) => string;
    // Data helpers
    getPesoTransporte: (e: any) => number;
}

export function EncomendaList({
    loading,
    encomendas,
    onView,
    onEdit,
    onDelete,
    onTransport,
    onStatusChange,
    onDateUpdate,
    canEditOrders,
    canEditProduction,
    canEditDelivery,
    hidePrices,
    isHam,
    t,
    formatCurrency,
    formatDate,
    getPesoTransporte,
}: EncomendaListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const parentRef = useRef<HTMLDivElement>(null);

    // Only virtualize if we have more than 20 items
    const shouldVirtualize = encomendas.length > 20;

    const virtualizer = useVirtualizer({
        count: encomendas.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 180, // Estimated card height + gap
        overscan: 5,
        enabled: shouldVirtualize,
    });

    if (encomendas.length === 0) {
        return (
            <div className="bg-card border-border/50 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center shadow-sm">
                <Package className="text-muted-foreground mb-4 h-12 w-12 opacity-50" />
                <h3 className="text-foreground text-lg font-medium">{t.noOrders}</h3>
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    Tente ajustar os filtros ou crie uma nova encomenda.
                </p>
            </div>
        );
    }

    // For small lists, render without virtualization
    if (!shouldVirtualize) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {encomendas.map((e) => (
                    <EncomendaCard
                        key={e.id}
                        encomenda={e}
                        onView={() => onView(e)}
                        onEdit={() => onEdit(e)}
                        onDelete={() => onDelete(e.id)}
                        onTransport={() => onTransport(e)}
                        onStatusChange={onStatusChange}
                        onDateUpdate={onDateUpdate}
                        canEditOrders={canEditOrders}
                        canEditProduction={canEditProduction}
                        canEditDelivery={canEditDelivery}
                        hidePrices={hidePrices}
                        isHam={isHam}
                        t={t}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        pesoTransporte={getPesoTransporte(e)}
                    />
                ))}
            </div>
        );
    }

    // Virtualized list for large datasets
    return (
        <div
            ref={parentRef}
            className="max-h-[calc(100vh-300px)] overflow-auto"
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const e = encomendas[virtualRow.index];
                    return (
                        <div
                            key={e.id}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="pb-4"
                        >
                            <EncomendaCard
                                encomenda={e}
                                onView={() => onView(e)}
                                onEdit={() => onEdit(e)}
                                onDelete={() => onDelete(e.id)}
                                onTransport={() => onTransport(e)}
                                onStatusChange={onStatusChange}
                                onDateUpdate={onDateUpdate}
                                canEditOrders={canEditOrders}
                                canEditProduction={canEditProduction}
                                canEditDelivery={canEditDelivery}
                                hidePrices={hidePrices}
                                isHam={isHam}
                                t={t}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                                pesoTransporte={getPesoTransporte(e)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
