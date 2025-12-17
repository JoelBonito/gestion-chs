import { useState, useMemo } from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
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
import { Eye, Edit, Paperclip, Trash2, MoreHorizontal, Package, PackageOpen } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import ProdutoView from "@/components/ProdutoView";
import { AttachmentManager } from "@/components/AttachmentManager";
import { EstoqueEditModal } from "@/components/EstoqueEditModal";
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

    // UUID do fornecedor alvo (fornecedor de produção)
    const FORNECEDOR_PRODUCAO_ID = "b8f995d2-47dc-4c8f-9779-ce21431f5244";

    // Modais State
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
    const [showView, setShowView] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEstoqueEdit, setShowEstoqueEdit] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const handleAction = (produto: Produto, action: "view" | "edit" | "attachments" | "estoque" | "delete") => {
        setSelectedProduto(produto);
        if (action === "view") setShowView(true);
        if (action === "edit") setShowEdit(true);
        if (action === "attachments") setShowAttachments(true);
        if (action === "estoque") setShowEstoqueEdit(true);
        if (action === "delete") setShowDeleteAlert(true);
    };



    const renderEstoqueCell = (valor: number | undefined) => {
        const val = valor ?? 0;
        const isLow = val < 200;
        const isNegative = val < 0;

        return (
            <span className={`font-semibold ${isNegative ? "text-destructive" :
                isLow ? "text-warning" :
                    "text-foreground"
                }`}>
                {val}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="w-full space-y-4">
                <GlassCard className="p-4">
                    <div className="space-y-4 py-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-[200px] bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-[150px] bg-muted animate-pulse rounded" />
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
    // Define larguras de colunas sincronizadas (Ajustado para caber na tela sem scroll horizontal)
    const gridCols = hidePrices
        ? "70px minmax(200px, 1.5fr) minmax(120px, 1fr) minmax(120px, 1fr) 80px 80px 80px 60px"
        : "70px minmax(200px, 1.5fr) minmax(120px, 1fr) minmax(110px, 1fr) 70px 70px 70px 90px 90px 60px";

    return (
        <>
            {/* Desktop View (Table) - Visible only on LG screens and up */}
            <GlassCard className="hidden lg:flex overflow-hidden flex-col">
                {/* Header Fixo - FORA do scroll */}
                <div
                    className="bg-muted/80 dark:bg-muted/40 border-b shadow-sm px-4 py-3"
                    style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px', alignItems: 'center' }}
                >
                    <span className="text-xs font-medium text-muted-foreground uppercase">Imagem</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Produto</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Marca / Cat.</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Fornecedor</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase text-center">Garrafas</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase text-center">Tampas</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase text-center">Rótulos</span>
                    {!hidePrices && <span className="text-xs font-medium text-muted-foreground uppercase text-right">P. Custo</span>}
                    {!hidePrices && <span className="text-xs font-medium text-muted-foreground uppercase text-right">P. Venda</span>}
                    <span className="text-xs font-medium text-muted-foreground uppercase text-right">Ações</span>
                </div>

                {/* Body com Scroll */}
                <div className="overflow-y-auto flex-1 max-h-[calc(100vh-320px)]">
                    {produtos.map((produto) => {
                        const isFornecedorProducao = (produto as any).fornecedores?.id === FORNECEDOR_PRODUCAO_ID || produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
                        const fornecedorNome = (produto as any).fornecedores?.nome || "-";

                        return (
                            <div
                                key={produto.id}
                                className={cn(
                                    "border-b last:border-0 hover:bg-muted/30 transition-colors px-4 py-3 group",
                                    !produto.ativo && "opacity-60 bg-muted/10"
                                )}
                                style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px', alignItems: 'center' }}
                            >
                                {/* Células da tabela... (mantendo lógica existente) */}
                                <div className="relative">
                                    <Avatar className="h-10 w-10 rounded-lg border bg-white shadow-sm cursor-pointer hover:scale-110 transition-transform" onClick={() => handleAction(produto, "view")}>
                                        <AvatarImage src={produto.imagem_url || ""} alt={produto.nome} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-primary/5 text-primary text-xs font-bold">
                                            {produto.nome.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!produto.ativo && (
                                        <Badge variant="destructive" className="absolute -top-2 -right-2 text-[8px] h-4 px-1">Inativo</Badge>
                                    )}
                                </div>

                                <div className="flex flex-col min-w-0 pr-2">
                                    <span
                                        className="font-medium text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                                        title={produto.nome}
                                        onClick={() => handleAction(produto, "view")}
                                    >
                                        {produto.nome}
                                    </span>
                                    {produto.descricao && (
                                        <span className="text-xs text-muted-foreground truncate hidden xl:inline-block" title={produto.descricao}>
                                            {produto.descricao}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col min-w-0 text-xs">
                                    <span className="font-medium text-foreground truncate" title={produto.marca}>{produto.marca}</span>
                                    <span className="text-muted-foreground truncate" title={produto.tipo}>{produto.tipo}</span>
                                </div>

                                <div className="min-w-0" title={fornecedorNome}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground truncate block max-w-full">
                                            {fornecedorNome}
                                        </span>
                                    </div>
                                </div>

                                {/* Estoque */}
                                <div className="text-center text-xs tabular-nums">
                                    {isFornecedorProducao ? renderEstoqueCell(produto.estoque_garrafas) : <span className="text-muted-foreground/30">—</span>}
                                </div>
                                <div className="text-center text-xs tabular-nums">
                                    {isFornecedorProducao ? renderEstoqueCell(produto.estoque_tampas) : <span className="text-muted-foreground/30">—</span>}
                                </div>
                                <div className="text-center text-xs tabular-nums">
                                    {isFornecedorProducao ? renderEstoqueCell(produto.estoque_rotulos) : <span className="text-muted-foreground/30">—</span>}
                                </div>

                                {/* Preços */}
                                {!hidePrices && (
                                    <div className="text-right text-xs tabular-nums font-mono text-muted-foreground">
                                        {formatCurrencyEUR(produto.preco_custo)}
                                    </div>
                                )}
                                {!hidePrices && (
                                    <div className="text-right text-xs tabular-nums font-mono font-medium text-foreground">
                                        {formatCurrencyEUR(produto.preco_venda)}
                                    </div>
                                )}

                                {/* Ações */}
                                <div className="flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                            {isFornecedorProducao && (
                                                <DropdownMenuItem onClick={() => handleAction(produto, "estoque")}>
                                                    <PackageOpen className="mr-2 h-4 w-4" />
                                                    Editar Estoque
                                                </DropdownMenuItem>
                                            )}
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Mobile/Tablet View (Cards) - Show on screens smaller than LG */}
            <div className="lg:hidden space-y-4">
                {produtos.map((produto) => {
                    const isFornecedorProducao = (produto as any).fornecedores?.id === FORNECEDOR_PRODUCAO_ID || produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
                    const fornecedorNome = (produto as any).fornecedores?.nome || "-";

                    return (
                        <GlassCard key={produto.id} className="p-4 space-y-3">
                            {/* Header: Imagem, Nome e Ações */}
                            <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12 rounded-lg border bg-white shadow-sm flex-shrink-0">
                                    <AvatarImage src={produto.imagem_url || ""} alt={produto.nome} className="object-cover" />
                                    <AvatarFallback className="rounded-lg bg-warning/10 text-warning font-bold text-sm">
                                        {produto.nome.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                                        {produto.nome}
                                    </h4>
                                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                                        <span className="font-medium text-foreground/80">{produto.marca}</span>
                                        <span>•</span>
                                        <span>{produto.tipo}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {fornecedorNome}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -mr-2">
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
                                        {isFornecedorProducao && (
                                            <DropdownMenuItem onClick={() => handleAction(produto, "estoque")}>
                                                <PackageOpen className="mr-2 h-4 w-4" />
                                                Editar Estoque
                                            </DropdownMenuItem>
                                        )}
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
                            </div>

                            {/* Preços e Estoque */}
                            <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
                                {!hidePrices && (
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground uppercase block font-semibold">Preço</span>
                                        <div className="font-medium">{formatCurrencyEUR(produto.preco_venda)}</div>
                                        <div className="text-xs text-muted-foreground">Custo: {formatCurrencyEUR(produto.preco_custo)}</div>
                                    </div>
                                )}

                                {isFornecedorProducao && (
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground uppercase block font-semibold">Estoque</span>
                                        <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                            <div className="bg-muted/50 rounded p-1">
                                                <div className="font-bold">{produto.estoque_garrafas}</div>
                                                <div className="text-[10px] text-muted-foreground">Gar.</div>
                                            </div>
                                            <div className="bg-muted/50 rounded p-1">
                                                <div className="font-bold">{produto.estoque_tampas}</div>
                                                <div className="text-[10px] text-muted-foreground">Tam.</div>
                                            </div>
                                            <div className="bg-muted/50 rounded p-1">
                                                <div className="font-bold">{produto.estoque_rotulos}</div>
                                                <div className="text-[10px] text-muted-foreground">Rot.</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    );
                })}
            </div>

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

                    {/* Modal de Edição de Estoque */}
                    <EstoqueEditModal
                        produto={selectedProduto}
                        open={showEstoqueEdit}
                        onOpenChange={setShowEstoqueEdit}
                        onSuccess={onUpdate}
                    />

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
