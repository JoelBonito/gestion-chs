import { useState, useMemo } from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, Edit, Paperclip, Trash2, MoreHorizontal, Package } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import ProdutoView from "@/components/ProdutoView";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAttachments } from "@/hooks/useAttachments";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import { Produto } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProdutosTableProps {
    produtos: Produto[];
    loading: boolean;
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, currentStatus: boolean) => void;
}

export function ProdutosTable({
    produtos,
    loading,
    onUpdate,
    onDelete,
    onToggleActive
}: ProdutosTableProps) {
    const { isCollaborator } = useIsCollaborator();
    const { user } = useAuth();
    const hidePrices = shouldHidePrices(user);

    // Modais State
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
    const [showView, setShowView] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const handleAction = (produto: Produto, action: "view" | "edit" | "attachments" | "delete") => {
        setSelectedProduto(produto);
        if (action === "view") setShowView(true);
        if (action === "edit") setShowEdit(true);
        if (action === "attachments") setShowAttachments(true);
        if (action === "delete") setShowDeleteAlert(true);
    };

    if (loading) {
        return (
            <div className="w-full space-y-4">
                <GlassCard className="p-4">
                    <div className="space-y-4 py-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-[200px] bg-slate-200 animate-pulse rounded" />
                                    <div className="h-4 w-[150px] bg-slate-200 animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        );
    }

    if (produtos.length === 0) {
        return (
            <GlassCard className="text-center py-12 flex flex-col items-center justify-center border-dashed">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium text-foreground">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar seus filtros ou cadastre um novo produto.</p>
            </GlassCard>
        );
    }

    return (
        <>
            <GlassCard className="overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Imagem</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Marca / Categoria</TableHead>
                            {!hidePrices && <TableHead>Preço</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {produtos.map((produto) => (
                            <TableRow key={produto.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                    <Avatar className="h-12 w-12 rounded-lg border bg-white shadow-sm">
                                        <AvatarImage src={produto.imagem_url || ""} alt={produto.nome} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-orange-100 text-orange-600 font-bold">
                                            {produto.nome.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">{produto.nome}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-1">{produto.descricao}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{produto.marca || "-"}</span>
                                        <span className="text-xs text-muted-foreground">{produto.tipo || "-"}</span>
                                    </div>
                                </TableCell>
                                {!hidePrices && (
                                    <TableCell className="font-medium">
                                        {formatCurrencyEUR(produto.preco_venda)}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Badge
                                        variant={produto.ativo ? "default" : "secondary"}
                                        className={produto.ativo ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                                        onClick={() => !isCollaborator && onToggleActive(produto.id, produto.ativo || false)}
                                        style={{ cursor: !isCollaborator ? 'pointer' : 'default' }}
                                    >
                                        {produto.ativo ? "Ativo" : "Inativo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[160px]">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleAction(produto, "view")}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Visualizar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAction(produto, "attachments")}>
                                                <Paperclip className="mr-2 h-4 w-4" />
                                                Anexos
                                            </DropdownMenuItem>
                                            {!isCollaborator && !hidePrices && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleAction(produto, "edit")}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleAction(produto, "delete")} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </GlassCard>

            {/* Modais Gerenciados Internamente */}
            {selectedProduto && (
                <>
                    {/* Modal de Visualização */}
                    <Dialog open={showView} onOpenChange={setShowView}>
                        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Visualizar Produto</DialogTitle>
                                <DialogDescription>Detalhes do produto selecionado.</DialogDescription>
                            </DialogHeader>
                            <ProdutoView produto={selectedProduto} onClose={() => setShowView(false)} />
                        </DialogContent>
                    </Dialog>

                    {/* Modal de Anexos */}
                    <Dialog open={showAttachments} onOpenChange={setShowAttachments}>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Anexos do Produto</DialogTitle>
                                <DialogDescription>Gerenciar arquivos de {selectedProduto.nome}</DialogDescription>
                            </DialogHeader>
                            <AttachmentManager
                                entityType="produto"
                                entityId={selectedProduto.id}
                                onChanged={() => { }}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Modal de Edição */}
                    <Dialog open={showEdit} onOpenChange={setShowEdit}>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Editar Produto</DialogTitle>
                                <DialogDescription>Atualize as informações do produto.</DialogDescription>
                            </DialogHeader>
                            <ProdutoForm
                                produto={selectedProduto}
                                isEditing={true}
                                onSuccess={() => {
                                    setShowEdit(false);
                                    onUpdate();
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    {/* Alerta de Exclusão */}
                    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Produto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja excluir <b>{selectedProduto.nome}</b>? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => {
                                        onDelete(selectedProduto.id);
                                        setShowDeleteAlert(false);
                                    }}
                                >
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    );
}
