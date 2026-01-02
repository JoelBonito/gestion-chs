/**
 * EncomendaTabs - Navegação por Abas
 * Extraído de Encomendas.tsx para modularização
 */
import { memo } from "react";
import { cn } from "@/lib/utils";

type TabType = "encomendas" | "transportes" | "tarefas" | "amostras";

interface EncomendaTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isHam: boolean;
  isRosaUser: boolean;
  hasAmostrasAccess: boolean;
  ordersLabel: string;
}

function EncomendaTabsComponent({
  activeTab,
  onTabChange,
  isHam,
  isRosaUser,
  hasAmostrasAccess,
  ordersLabel,
}: EncomendaTabsProps) {
  const tabClass = (isActive: boolean) =>
    cn(
      "border-b-2 px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm",
      isActive
        ? "border-primary text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/10 border-transparent"
    );

  return (
    <div className="border-border/40 no-scrollbar -mx-1 mb-4 flex overflow-x-auto border-b sm:mb-6">
      <button
        onClick={() => onTabChange("encomendas")}
        className={tabClass(activeTab === "encomendas")}
      >
        {ordersLabel}
      </button>

      {!isRosaUser && (
        <button
          onClick={() => onTabChange("transportes")}
          className={tabClass(activeTab === "transportes")}
        >
          {isHam ? "Transport" : "Transporte"}
        </button>
      )}

      {!isHam && !isRosaUser && (
        <button
          onClick={() => onTabChange("tarefas")}
          className={tabClass(activeTab === "tarefas")}
        >
          Tarefas
        </button>
      )}

      {hasAmostrasAccess && (
        <button
          onClick={() => onTabChange("amostras")}
          className={tabClass(activeTab === "amostras")}
        >
          Amostras
        </button>
      )}
    </div>
  );
}

export const EncomendaTabs = memo(EncomendaTabsComponent);
