import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ProducaoFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
}

export function ProducaoFilters({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
}: ProducaoFiltersProps) {
    return (
        <Card className="shadow-card bg-card">
            <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                        <Input
                            placeholder="Buscar por cliente ou ID..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="bg-background dark:bg-popover pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Status</SelectItem>
                            <SelectItem value="PEDIDO">Pedido</SelectItem>
                            <SelectItem value="PRODUCAO">Produção</SelectItem>
                            <SelectItem value="ENTREGA">Entrega</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
