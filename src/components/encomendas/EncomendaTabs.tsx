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
            "px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap",
            isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
        );

    return (
        <div className="flex border-b border-border/40 mb-4 sm:mb-6 overflow-x-auto no-scrollbar -mx-1">
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
