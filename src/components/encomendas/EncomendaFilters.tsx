/**
 * EncomendaFilters - Barra de Pesquisa e Filtros
 * Extraído de Encomendas.tsx para modularização
 */
import { memo } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";

type StatusEncomenda = "NOVO PEDIDO" | "MATÉRIA PRIMA" | "PRODUÇÃO" | "EMBALAGENS" | "TRANSPORTE" | "ENTREGUE";
type StatusFilter = StatusEncomenda | "TODOS";

interface EncomendaFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedStatus: StatusFilter;
    onStatusChange: (status: StatusFilter) => void;
    showCompleted: boolean;
    onShowCompletedChange: (value: boolean) => void;
    translations: {
        searchPlaceholder: string;
        showDelivered: string;
    };
}

function EncomendaFiltersComponent({
    searchTerm,
    onSearchChange,
    selectedStatus,
    onStatusChange,
    showCompleted,
    onShowCompletedChange,
    translations: t,
}: EncomendaFiltersProps) {
    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm">
            {/* Busca */}
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t.searchPlaceholder}
                    className="pl-10 h-10 w-full"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                {/* Status Filter */}
                <div className="w-full sm:w-auto sm:border-l border-border/50 sm:pl-2 h-10 flex items-center">
                    <EncomendaStatusFilter
                        selectedStatus={selectedStatus}
                        onStatusChange={onStatusChange}
                    />
                </div>

                {/* Toggle Entregues */}
                <div className="flex items-center gap-3 px-3 border-l border-border/50 h-6 shrink-0 ml-auto sm:ml-0">
                    <Switch
                        id="show-completed"
                        checked={showCompleted}
                        onCheckedChange={onShowCompletedChange}
                    />
                    <Label
                        htmlFor="show-completed"
                        className="cursor-pointer text-sm font-medium whitespace-nowrap text-foreground dark:text-white"
                    >
                        {t.showDelivered}
                    </Label>
                </div>
            </div>
        </div>
    );
}

export const EncomendaFilters = memo(EncomendaFiltersComponent);
