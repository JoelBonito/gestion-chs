import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiSelect, Option } from "@/components/ui/multi-select";

interface ProdutoFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategorias: string[];
    onCategoriasChange: (values: string[]) => void;
    categorias: Option[];
    selectedFornecedores: string[];
    onFornecedoresChange: (values: string[]) => void;
    fornecedores: Option[];
    showInactive: boolean;
    onShowInactiveChange: (value: boolean) => void;
    t: (k: string) => string;
}

export function ProdutoFilters({
    searchTerm,
    onSearchChange,
    selectedCategorias,
    onCategoriasChange,
    categorias,
    selectedFornecedores,
    onFornecedoresChange,
    fornecedores,
    showInactive,
    onShowInactiveChange,
    t,
}: ProdutoFiltersProps) {
    return (
        <div className="bg-card border-border sticky top-0 z-10 mb-6 flex flex-col items-center gap-4 rounded-xl border p-3 shadow-sm sm:flex-row">
            <div className="group relative w-full flex-1">
                <Search className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                <Input
                    placeholder={t("Buscar produtos...")}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 w-full pl-10"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 p-1 lg:p-0">
                <div className="w-[160px]">
                    <MultiSelect
                        options={categorias}
                        selected={selectedCategorias}
                        onChange={onCategoriasChange}
                        placeholder={t("Categorias")}
                        className="h-10"
                    />
                </div>

                <div className="w-[160px]">
                    <MultiSelect
                        options={fornecedores}
                        selected={selectedFornecedores}
                        onChange={onFornecedoresChange}
                        placeholder={t("Fornecedores")}
                        className="h-10"
                    />
                </div>

                <div className="border-border/50 flex h-8 shrink-0 items-center gap-4 border-l px-3">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="show-inactive-produtos"
                            checked={showInactive}
                            onCheckedChange={onShowInactiveChange}
                        />
                    </div>
                    <Label
                        htmlFor="show-inactive-produtos"
                        className="text-muted-foreground cursor-pointer text-xs font-bold tracking-wider whitespace-nowrap uppercase"
                    >
                        {t("Mostrar Inativos")}
                    </Label>
                </div>
            </div>
        </div>
    );
}
