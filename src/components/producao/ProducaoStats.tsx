import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, Truck } from "lucide-react";

interface ProducaoStatsProps {
    stats: {
        total: number;
        PEDIDO: number;
        PRODUCAO: number;
        ENTREGA: number;
    };
}

export function ProducaoStats({ stats }: ProducaoStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                    <Package className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>

            <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                    <Package className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.PEDIDO}</div>
                </CardContent>
            </Card>

            <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produção</CardTitle>
                    <Clock className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.PRODUCAO}</div>
                </CardContent>
            </Card>

            <Card className="bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Entrega</CardTitle>
                    <Truck className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.ENTREGA}</div>
                </CardContent>
            </Card>
        </div>
    );
}
