/**
 * EncomendaCard - Componente de card individual para encomendas
 * Extraído de Encomendas.tsx para modularização
 */
import { memo } from "react";
import { Eye, Edit, User, Building2, CalendarIcon, Package, Truck, TrendingUp, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlassCard } from "@/components/GlassCard";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { cn } from "@/lib/utils";

// Types
type StatusEncomenda = "NOVO PEDIDO" | "MATÉRIA PRIMA" | "PRODUÇÃO" | "EMBALAGENS" | "TRANSPORTE" | "ENTREGUE";

interface Encomenda {
    id: string;
    numero_encomenda: string;
    etiqueta?: string | null;
    status: StatusEncomenda;
    valor_total: number;
    valor_pago: number;
    data_criacao: string;
    data_producao_estimada?: string | null;
    data_envio_estimada?: string | null;
    observacoes?: string | null;
    cliente_id?: string;
    fornecedor_id?: string;
    clientes?: { nome: string | null } | null;
    fornecedores?: { nome: string | null } | null;
    cliente_nome?: string | null;
    fornecedor_nome?: string | null;
    commission_amount?: number;
    valor_total_custo?: number;
    peso_bruto?: number;
}

interface EncomendaCardProps {
    encomenda: Encomenda;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onTransport: () => void;
    onStatusChange: () => void;
    onDateUpdate: (
        encomendaId: string,
        field: "data_producao_estimada" | "data_envio_estimada",
        value: string
    ) => void;
    // Permissions
    canEditOrders: boolean;
    canEditProduction: boolean;
    canEditDelivery: boolean;
    hidePrices: boolean;
    isHam: boolean;
    // Translations
    t: Record<string, string>;
    // Formatters
    formatCurrency: (value: number) => string;
    formatDate: (date: string) => string;
    // Data
    pesoTransporte: number;
}

function EncomendaCardComponent({
    encomenda: e,
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
    pesoTransporte,
}: EncomendaCardProps) {

    const getStatusLabel = (status: StatusEncomenda): string => {
        if (!isHam) return status;
        switch (status) {
            case "NOVO PEDIDO": return "Nouvelle demande";
            case "MATÉRIA PRIMA": return "Matières premières";
            case "PRODUÇÃO": return "Production";
            case "EMBALAGENS": return "Emballage";
            case "TRANSPORTE": return "Transport";
            case "ENTREGUE": return "Livré";
            default: return status;
        }
    };

    return (
        <GlassCard className="flex flex-col h-full overflow-hidden bg-card border-border/50 transition-all hover:shadow-lg hover:border-primary/20 group" hoverEffect>
            <div className="flex-1 p-5 space-y-4" onClick={onView}>
                {/* Header: ID, Tag & Date */}
                {/* Header: ID, Tag & Date */}
                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex items-center justify-between w-full border-b border-border/30 pb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-lg font-bold font-mono text-primary shrink-0">
                                #{e.numero_encomenda}
                            </span>
                            {e.etiqueta && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-1.5 py-0 uppercase font-bold tracking-wide border-0 truncate max-w-[150px]">
                                    {e.etiqueta}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(e.data_criacao)}
                        </div>
                    </div>

                    {/* Status Row - Explicitly new line */}
                    <div onClick={(ev) => ev.stopPropagation()} className="w-full relative z-10 pt-1">
                        {isHam ? (
                            <Badge variant="outline" className="text-[10px] font-medium py-0.5 px-2 bg-background w-fit">
                                {getStatusLabel(e.status)}
                            </Badge>
                        ) : (
                            <div className="w-full">
                                <EncomendaStatusSelect
                                    encomendaId={e.id}
                                    currentStatus={e.status}
                                    numeroEncomenda={e.numero_encomenda}
                                    onStatusChange={onStatusChange}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Cliente / Fornecedor Info */}
                <div className="space-y-2 pt-2 pb-2">
                    <div className="flex items-center gap-2.5 text-sm">
                        <User className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                        <span className="text-foreground font-medium truncate" title={e.clientes?.nome ?? e.cliente_nome ?? ""}>
                            {e.clientes?.nome ?? e.cliente_nome ?? "—"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                        <span className="text-foreground/80 truncate" title={e.fornecedores?.nome ?? e.fornecedor_nome ?? ""}>
                            {e.fornecedores?.nome ?? e.fornecedor_nome ?? "—"}
                        </span>
                    </div>
                </div>

                {/* Datas & Peso Grid */}
                {!isHam && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-border/40 text-xs" onClick={(ev) => ev.stopPropagation()}>
                        {/* Produção */}
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {t.productionDate}
                            </span>
                            {canEditProduction ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="font-medium text-foreground hover:text-primary transition-colors text-left truncate w-full flex items-center gap-1">
                                            {e.data_producao_estimada ? format(new Date(e.data_producao_estimada), "dd/MM/yy") : "Definir"}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={e.data_producao_estimada ? new Date(e.data_producao_estimada) : undefined}
                                            onSelect={(d) => onDateUpdate(e.id, "data_producao_estimada", d ? format(d, "yyyy-MM-dd") : "")}
                                        />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <span className="font-medium text-foreground">{e.data_producao_estimada ? format(new Date(e.data_producao_estimada), "dd/MM/yy") : "—"}</span>
                            )}
                        </div>

                        {/* Entrega */}
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {t.deliveryDate}
                            </span>
                            {canEditDelivery ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="font-medium text-foreground hover:text-primary transition-colors text-left truncate w-full flex items-center gap-1">
                                            {e.data_envio_estimada ? format(new Date(e.data_envio_estimada), "dd/MM/yy") : "Definir"}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={e.data_envio_estimada ? new Date(e.data_envio_estimada) : undefined}
                                            onSelect={(d) => onDateUpdate(e.id, "data_envio_estimada", d ? format(d, "yyyy-MM-dd") : "")}
                                        />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <span className="font-medium text-foreground">{e.data_envio_estimada ? format(new Date(e.data_envio_estimada), "dd/MM/yy") : "—"}</span>
                            )}
                        </div>

                        {/* Peso */}
                        <div className="col-span-2 pt-1 flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {t.grossWeight}
                            </span>
                            <span className="font-medium text-foreground">{pesoTransporte.toFixed(1)} kg</span>
                        </div>
                    </div>
                )}

                {/* Financial Summary */}
                {!hidePrices && (
                    <div className="pt-3 mt-1 border-t border-border/40 flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">{t.total}</span>
                            <span className="font-bold text-sm text-foreground">{formatCurrency(e.valor_total || 0)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-muted-foreground text-[10px] uppercase font-bold">{t.paid}</span>
                            <span className={cn("font-bold text-sm", (e.valor_pago || 0) >= (e.valor_total || 0) ? "text-success" : "text-warning")}>
                                {formatCurrency(e.valor_pago || 0)}
                            </span>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="bg-muted/40 border-t border-border/50 p-3 flex justify-end items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onView} className="h-8 text-xs gap-1.5 hover:bg-background hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-border/50">
                    <Eye className="h-3.5 w-3.5" />
                    Visualizar
                </Button>

                {canEditOrders && (
                    <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-xs gap-1.5 hover:bg-background hover:text-blue-500 hover:shadow-sm transition-all border border-transparent hover:border-border/50">
                        <Edit className="h-3.5 w-3.5" />
                        Editar
                    </Button>
                )}

                <div className="pl-1 border-l border-border/30">
                    <EncomendaActions
                        encomenda={e as any}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onTransport={onTransport}
                        canEditOrders={canEditOrders}
                    />
                </div>
            </div>
        </GlassCard>
    );
}

// Memoizado para evitar re-renders desnecessários
export const EncomendaCard = memo(EncomendaCardComponent);
