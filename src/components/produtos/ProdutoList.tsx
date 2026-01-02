import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { ProdutoActions } from "@/components/produtos/ProdutoActions";
import { Produto } from "@/types/database";

interface JoinedProduto extends Produto {
    fornecedores?: { id: string; nome: string } | null;
}

interface ProdutoListProps {
    produtos: JoinedProduto[];
    loading: boolean;
    isHam: boolean;
    hidePrices: boolean;
    FORNECEDOR_PRODUCAO_ID: string;
    onEdit: (produto: Produto) => void;
    onView: (produto: Produto) => void;
    onRefresh: () => void;
    t: (k: string) => string;
}

export function ProdutoList({
    produtos,
    loading,
    isHam,
    hidePrices,
    FORNECEDOR_PRODUCAO_ID,
    onEdit,
    onView,
    onRefresh,
    t,
}: ProdutoListProps) {
    if (loading) {
        return (
            <div className="text-muted-foreground py-12 text-center">
                {t("Carregando produtos...")}
            </div>
        );
    }

    if (produtos.length === 0) {
        return (
            <div className="text-muted-foreground bg-card border-border/30 rounded-xl border py-12 text-center">
                {t("Nenhum produto encontrado.")}
            </div>
        );
    }

    return (
        <>
            {/* Tabela - Desktop */}
            <div className="border-border/30 bg-card hidden overflow-x-auto rounded-2xl border shadow-2xl xl:block">
                <Table className="bg-card w-full min-w-[950px] table-fixed border-collapse">
                    <TableHeader className="bg-card border-border border-b">
                        <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="text-muted-foreground w-[28%] py-4 pl-6 text-[10px] font-bold tracking-wider uppercase">
                                {t("Produto")}
                            </TableHead>
                            <TableHead className="text-muted-foreground w-[16%] py-4 text-[10px] font-bold tracking-wider uppercase">
                                <div className="flex flex-col gap-0.5">
                                    <span className="leading-tight">{t("Marca")}</span>
                                    <span className="leading-tight">{t("Categoria")}</span>
                                </div>
                            </TableHead>
                            <TableHead className="text-muted-foreground w-[18%] py-4 text-[10px] font-bold tracking-wider uppercase">
                                {t("Fornecedor")}
                            </TableHead>
                            <TableHead className="text-muted-foreground w-[14%] py-4 text-center text-[10px] font-bold tracking-wider uppercase">
                                {t("Estoques")}
                            </TableHead>
                            {!isHam && !hidePrices && (
                                <>
                                    <TableHead className="text-muted-foreground w-[9%] py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="leading-tight">{t("Preço")}</span>
                                            <span className="leading-tight">{t("Custo")}</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-muted-foreground w-[9%] py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="leading-tight">{t("Preço")}</span>
                                            <span className="leading-tight">{t("Venda")}</span>
                                        </div>
                                    </TableHead>
                                </>
                            )}
                            {isHam && (
                                <TableHead className="text-muted-foreground w-[12%] py-4 text-right text-[10px] font-bold tracking-wider uppercase">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="leading-tight">{t("Preço")}</span>
                                        <span className="leading-tight">{t("Venda")}</span>
                                    </div>
                                </TableHead>
                            )}
                            <TableHead className="text-muted-foreground w-[10%] py-4 pr-6 text-right text-[10px] font-bold tracking-wider uppercase">
                                {t("Ações")}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {produtos.map((produto) => {
                            const isFornecedorProducao =
                                produto.fornecedores?.id === FORNECEDOR_PRODUCAO_ID ||
                                produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
                            const fornecedorNome = produto.fornecedores?.nome || "-";

                            return (
                                <TableRow
                                    key={produto.id}
                                    className={cn(
                                        "bg-card hover:bg-muted/50 border-border/40 group cursor-pointer border-b transition-colors",
                                        !produto.ativo && "opacity-60 grayscale"
                                    )}
                                    onClick={() => onView(produto)}
                                >
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-foreground cursor-default truncate text-sm font-bold tracking-tight uppercase">
                                                            {produto.nome}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-card border-border/10 border">
                                                        <p className="text-xs">{produto.nome}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div className="flex items-center gap-2">
                                                {produto.new_product && (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 h-4 px-1 text-[9px] leading-none font-black uppercase">
                                                        {t("Novo")}
                                                    </Badge>
                                                )}
                                                <span className="text-muted-foreground/70 truncate text-[10px] font-black tracking-wider uppercase">
                                                    {produto.marca}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-foreground truncate text-xs font-bold uppercase">
                                                {produto.marca}
                                            </span>
                                            <span className="text-muted-foreground/60 text-[10px] font-medium uppercase">
                                                {produto.tipo}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="text-muted-foreground flex cursor-help items-center gap-2 truncate text-xs font-black tracking-wide uppercase">
                                                        <Truck className="h-3 w-3 shrink-0 opacity-40" />
                                                        <span className="truncate">{fornecedorNome}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-card border-border/10 border">
                                                    <p className="text-xs">{fornecedorNome}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            {[
                                                { label: t("Gar."), val: produto.estoque_garrafas },
                                                { label: t("Tam."), val: produto.estoque_tampas },
                                                { label: t("Rót."), val: produto.estoque_rotulos },
                                            ].map((e, i) => (
                                                <div key={i} className="flex flex-col items-center">
                                                    <span className="text-muted-foreground mb-1 text-[9px] uppercase">
                                                        {e.label}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-xs font-medium",
                                                            !isFornecedorProducao
                                                                ? "text-muted-foreground/50"
                                                                : (e.val || 0) < 100
                                                                    ? "text-amber-500"
                                                                    : "text-emerald-500"
                                                        )}
                                                    >
                                                        {isFornecedorProducao ? (e.val ?? "—") : "—"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    {!isHam && !hidePrices && (
                                        <TableCell className="py-4 text-right tabular-nums">
                                            <span className="text-muted-foreground text-[12px] font-bold">
                                                {formatCurrencyEUR(produto.preco_custo || 0)}
                                            </span>
                                        </TableCell>
                                    )}
                                    {(!hidePrices || isHam) && (
                                        <TableCell className="py-4 text-right tabular-nums">
                                            <span className="text-primary text-sm font-bold">
                                                {formatCurrencyEUR(produto.preco_venda)}
                                            </span>
                                        </TableCell>
                                    )}
                                    <TableCell className="py-4 pr-6 text-right">
                                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                            <ProdutoActions
                                                produto={produto}
                                                onEdit={() => onEdit(produto)}
                                                onView={() => onView(produto)}
                                                onRefresh={onRefresh}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile / Tablet View (Cards) */}
            <div className="flex flex-col gap-3 pb-20 xl:hidden">
                {produtos.map((produto) => {
                    const isFornecedorProducao =
                        produto.fornecedores?.id === FORNECEDOR_PRODUCAO_ID ||
                        produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
                    const fornecedorNome = produto.fornecedores?.nome || "-";

                    return (
                        <div
                            key={produto.id}
                            className={cn(
                                "bg-card border-border/30 hover:border-primary/30 group flex cursor-pointer flex-col gap-3 rounded-xl border p-4 shadow-sm transition-all",
                                !produto.ativo && "opacity-60 grayscale"
                            )}
                            onClick={() => onView(produto)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="text-foreground truncate text-sm font-bold tracking-tight uppercase">
                                        {produto.nome}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-muted-foreground/70 truncate text-[10px] font-bold uppercase">
                                            {produto.marca}
                                        </span>
                                        <span className="bg-border h-1 w-1 rounded-full" />
                                        <span className="text-muted-foreground/50 truncate text-[10px] uppercase">
                                            {produto.tipo}
                                        </span>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()} className="-mt-1 -mr-1 shrink-0">
                                    <ProdutoActions
                                        produto={produto}
                                        onEdit={() => onEdit(produto)}
                                        onView={() => onView(produto)}
                                        onRefresh={onRefresh}
                                        className="scale-90"
                                    />
                                </div>
                            </div>

                            <div className="text-muted-foreground/80 border-border/5 flex items-center gap-2 border-y py-2 text-[11px]">
                                <Truck className="h-3 w-3 shrink-0 opacity-50" />
                                <span className="truncate uppercase">{fornecedorNome}</span>
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {[
                                        { label: t("Gar."), val: produto.estoque_garrafas },
                                        { label: t("Tam."), val: produto.estoque_tampas },
                                        { label: t("Rót."), val: produto.estoque_rotulos },
                                    ].map((e, i) => (
                                        <div key={i} className="flex flex-col">
                                            <span className="text-muted-foreground mb-1 text-[8px] leading-none uppercase">
                                                {e.label}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[11px] leading-none font-bold",
                                                    !isFornecedorProducao
                                                        ? "text-muted-foreground/30"
                                                        : (e.val || 0) < 100
                                                            ? "text-amber-500"
                                                            : "text-emerald-500"
                                                )}
                                            >
                                                {isFornecedorProducao ? (e.val ?? "-") : "-"}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-right">
                                    <div className="text-muted-foreground mb-1 text-[9px] leading-none font-bold tracking-widest uppercase">
                                        {t("Venda")}
                                    </div>
                                    <div className="text-primary text-base leading-none font-bold">
                                        {formatCurrencyEUR(produto.preco_venda)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
