import { format } from "date-fns";
import { Eye, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ProducaoDetailDialog } from "./ProducaoDetailDialog";

interface Encomenda {
    id: string;
    numero_encomenda: string;
    valor_total: number;
    status_producao: string;
    data_criacao: string;
    data_producao_estimada?: string;
    data_envio_estimada?: string;
    observacoes?: string;
    clientes?: { nome: string };
    fornecedores?: { nome: string };
}

interface ItemEncomenda {
    id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    produtos?: { nome: string; marca: string; tipo: string };
}

interface ProducaoTableProps {
    encomendas: Encomenda[];
    loading: boolean;
    onUpdateStatus: (id: string, status: string) => void;
    onUpdateDataProducao: (id: string, date: Date | undefined) => void;
    onUpdateDataEnvio: (id: string, date: Date | undefined) => void;
    onVerEncomenda: (encomenda: Encomenda) => void;
    getStatusBadge: (status: string) => any;
    itensEncomenda: ItemEncomenda[];
    loadingItens: boolean;
    selectedEncomenda: Encomenda | null;
}

export function ProducaoTable({
    encomendas,
    loading,
    onUpdateStatus,
    onUpdateDataProducao,
    onUpdateDataEnvio,
    onVerEncomenda,
    getStatusBadge,
    itensEncomenda,
    loadingItens,
    selectedEncomenda,
}: ProducaoTableProps) {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[800px]">
                <Table>
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead className="min-w-[150px]">Cliente</TableHead>
                            <TableHead className="min-w-[150px]">Fornecedor</TableHead>
                            <TableHead className="w-[100px] text-right">Valor</TableHead>
                            <TableHead className="w-[140px] text-center">Data Produção</TableHead>
                            <TableHead className="w-[140px] text-center">Data Envio</TableHead>
                            <TableHead className="w-[120px] text-center">Status</TableHead>
                            <TableHead className="w-[50px] text-center">Ver</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow className="bg-background dark:bg-popover">
                                <TableCell colSpan={8} className="py-8 text-center">
                                    Carregando encomendas...
                                </TableCell>
                            </TableRow>
                        ) : encomendas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                    Nenhuma encomenda encontrada
                                </TableCell>
                            </TableRow>
                        ) : (
                            encomendas.map((encomenda) => {
                                const status = getStatusBadge(encomenda.status_producao);
                                const StatusIcon = status.icon;

                                return (
                                    <TableRow key={encomenda.id} className="hover:bg-muted/50">
                                        <TableCell className="w-[100px] font-medium">
                                            {encomenda.numero_encomenda}
                                        </TableCell>
                                        <TableCell className="min-w-[150px]">
                                            {encomenda.clientes?.nome || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground min-w-[150px] text-sm">
                                            {encomenda.fornecedores?.nome || "N/A"}
                                        </TableCell>
                                        <TableCell className="w-[100px] text-right font-semibold whitespace-nowrap">
                                            €{encomenda.valor_total.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="w-[140px]">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left text-xs font-normal",
                                                            !encomenda.data_producao_estimada && "text-muted-foreground"
                                                        )}
                                                        size="sm"
                                                    >
                                                        <CalendarIcon className="mr-1 h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {encomenda.data_producao_estimada
                                                                ? format(
                                                                    new Date(encomenda.data_producao_estimada),
                                                                    "dd/MM/yy"
                                                                )
                                                                : "Definir"}
                                                        </span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={
                                                            encomenda.data_producao_estimada
                                                                ? new Date(encomenda.data_producao_estimada)
                                                                : undefined
                                                        }
                                                        onSelect={(date) => onUpdateDataProducao(encomenda.id, date)}
                                                        initialFocus
                                                        className={cn("pointer-events-auto p-3")}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                        <TableCell className="w-[140px]">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left text-xs font-normal",
                                                            !encomenda.data_envio_estimada && "text-muted-foreground"
                                                        )}
                                                        size="sm"
                                                    >
                                                        <CalendarIcon className="mr-1 h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">
                                                            {encomenda.data_envio_estimada
                                                                ? format(new Date(encomenda.data_envio_estimada), "dd/MM/yy")
                                                                : "Definir"}
                                                        </span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={
                                                            encomenda.data_envio_estimada
                                                                ? new Date(encomenda.data_envio_estimada)
                                                                : undefined
                                                        }
                                                        onSelect={(date) => onUpdateDataEnvio(encomenda.id, date)}
                                                        initialFocus
                                                        className={cn("pointer-events-auto p-3")}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                        <TableCell className="w-[120px]">
                                            <div className="flex justify-center">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Badge
                                                            variant={status.variant}
                                                            className="flex w-fit cursor-pointer items-center gap-1 text-xs whitespace-nowrap transition-opacity hover:opacity-80"
                                                        >
                                                            <StatusIcon className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{status.label}</span>
                                                        </Badge>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="center">
                                                        <div className="p-2">
                                                            <Select
                                                                value={encomenda.status_producao}
                                                                onValueChange={(novoStatus) =>
                                                                    onUpdateStatus(encomenda.id, novoStatus)
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="PEDIDO">Pedido</SelectItem>
                                                                    <SelectItem value="PRODUCAO">Produção</SelectItem>
                                                                    <SelectItem value="ENTREGA">Entrega</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </TableCell>
                                        <TableCell className="w-[50px]">
                                            <div className="flex justify-center">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="hover:bg-muted h-8 w-8 p-0"
                                                            onClick={() => onVerEncomenda(encomenda)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <ProducaoDetailDialog
                                                        encomenda={selectedEncomenda}
                                                        itens={itensEncomenda}
                                                        loadingItens={loadingItens}
                                                        getStatusLabel={(s) => getStatusBadge(s).label}
                                                    />
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
