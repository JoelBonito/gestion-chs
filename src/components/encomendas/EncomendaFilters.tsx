/**
 * EncomendaFilters - Barra de Pesquisa e Filtros
 * Extraído de Encomendas.tsx para modularização
 */
import { memo } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EncomendaStatusFilter } from "./EncomendaStatusFilter";

import { StatusEncomenda } from "@/types/entities";

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
    <div className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border p-3 shadow-sm lg:flex-row">
      {/* Busca */}
      <div className="relative w-full flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={t.searchPlaceholder}
          className="h-10 w-full pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
        {/* Status Filter */}
        <div className="border-border/50 flex h-10 w-full items-center sm:w-auto sm:border-l sm:pl-2">
          <EncomendaStatusFilter selectedStatus={selectedStatus} onStatusChange={onStatusChange} />
        </div>

        {/* Toggle Entregues */}
        <div className="border-border/50 ml-auto flex h-6 shrink-0 items-center gap-3 border-l px-3 sm:ml-0">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={onShowCompletedChange}
          />
          <Label
            htmlFor="show-completed"
            className="text-foreground cursor-pointer text-sm font-medium whitespace-nowrap"
          >
            {t.showDelivered}
          </Label>
        </div>
      </div>
    </div>
  );
}

export const EncomendaFilters = memo(EncomendaFiltersComponent);
