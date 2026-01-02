import { format } from "date-fns";
import { Package } from "lucide-react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ItemEncomenda {
    id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    produtos?: { nome: string; marca: string; tipo: string };
}

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

interface ProducaoDetailDialogProps {
    encomenda: Encomenda | null;
    itens: ItemEncomenda[];
    loadingItens: boolean;
    getStatusLabel: (status: string) => string;
}

export function ProducaoDetailDialog({
    encomenda,
    itens,
    loadingItens,
    getStatusLabel,
}: ProducaoDetailDialogProps) {
    if (!encomenda) return null;

    return (
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                    Detalhes da Encomenda {encomenda.numero_encomenda}
                </DialogTitle>
                <DialogDescription>
                    Visualize todas as informações da encomenda e seus produtos
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Cliente</label>
                        <p className="text-sm">{encomenda.clientes?.nome || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Fornecedor</label>
                        <p className="text-sm">{encomenda.fornecedores?.nome || "N/A"}</p>
                    </div>
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Valor Total</label>
                        <p className="text-sm font-semibold">€{encomenda.valor_total.toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Status</label>
                        <p className="text-sm">{getStatusLabel(encomenda.status_producao)}</p>
                    </div>
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Data Criação</label>
                        <p className="text-sm">
                            {format(new Date(encomenda.data_criacao), "dd/MM/yyyy")}
                        </p>
                    </div>
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Data Produção</label>
                        <p className="text-sm">
                            {encomenda.data_producao_estimada
                                ? format(new Date(encomenda.data_producao_estimada), "dd/MM/yyyy")
                                : "Não definida"}
                        </p>
                    </div>
                    <div>
                        <label className="text-muted-foreground text-sm font-medium">Data Envio</label>
                        <p className="text-sm">
                            {encomenda.data_envio_estimada
                                ? format(new Date(encomenda.data_envio_estimada), "dd/MM/yyyy")
                                : "Não definida"}
                        </p>
                    </div>
                    {encomenda.observacoes && (
                        <div className="col-span-full">
                            <label className="text-muted-foreground text-sm font-medium">Observações</label>
                            <p className="text-sm">{encomenda.observacoes}</p>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="mb-4 text-lg font-semibold">Itens da Encomenda</h3>
                    {loadingItens ? (
                        <div className="py-4 text-center">Carregando itens...</div>
                    ) : itens.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center">
                            <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                            <p>Nenhum produto encontrado para esta encomenda</p>
                            <p className="mt-1 text-xs">
                                Os produtos devem ser adicionados ao criar/editar a encomenda
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Marca</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Qtd</TableHead>
                                    <TableHead className="text-right">Preço Unit.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itens.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.produtos?.nome || "N/A"}</TableCell>
                                        <TableCell>{item.produtos?.marca || "N/A"}</TableCell>
                                        <TableCell>{item.produtos?.tipo || "N/A"}</TableCell>
                                        <TableCell className="text-right">{item.quantidade}</TableCell>
                                        <TableCell className="text-right">€{item.preco_unitario.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            €{item.subtotal.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}
