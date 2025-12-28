import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ProdutoForm } from "@/components/ProdutoForm";
import ProdutoView from "@/components/ProdutoView";
import { PageContainer } from "@/components/PageContainer";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { ProdutoActions } from "@/components/ProdutoActions";
import { Produto } from "@/types/database";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function Produtos() {
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);
  const FORNECEDOR_PRODUCAO_ID = "b8f995d2-47dc-4c8f-9779-ce21431f5244";

  // Estados de Dados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showInactive, setShowInactive] = useState(false);

  const [categorias, setCategorias] = useState<Option[]>([]);
  const [fornecedores, setFornecedores] = useState<Option[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);

  // Modais
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  // Inicialização
  useEffect(() => {
    fetchFilters();
    fetchProdutos();
  }, []);

  const fetchFilters = async () => {
    try {
      const { data: produtosData } = await supabase
        .from("produtos")
        .select("tipo")
        .not("tipo", "is", null);

      if (produtosData) {
        const uniqueCategories = [...new Set(produtosData.map(p => p.tipo).filter(Boolean))];
        setCategorias(uniqueCategories.map(cat => ({ value: cat!, label: cat! })));
      }

      const { data: fornecedoresData } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("active", true)
        .order("nome");

      if (fornecedoresData) {
        setFornecedores(fornecedoresData.map(f => ({ value: f.id, label: f.nome })));
      }
    } catch (error) {
      console.error("Erro ao carregar filtros:", error);
    }
  };

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, fornecedores(id, nome)")
        .order("nome");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedProduto(null);
    fetchProdutos();
    fetchFilters();
  };

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setEditDialogOpen(true);
  };

  const handleView = (produto: Produto) => {
    setSelectedProduto(produto);
    setViewDialogOpen(true);
  };

  const filteredProdutos = useMemo(() => {
    return produtos.filter(produto => {
      if (!showInactive && !produto.ativo) return false;

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matches =
          produto.nome.toLowerCase().includes(q) ||
          (produto.marca || "").toLowerCase().includes(q) ||
          (produto.tipo || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedCategorias.length > 0) {
        if (!produto.tipo || !selectedCategorias.includes(produto.tipo)) return false;
      }

      if (selectedFornecedores.length > 0) {
        if (!produto.fornecedor_id || !selectedFornecedores.includes(produto.fornecedor_id)) return false;
      }

      return true;
    });
  }, [produtos, debouncedSearch, showInactive, selectedCategorias, selectedFornecedores]);


  const pageActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Produto</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Cadastre um novo produto no catálogo
          </DialogDescription>
        </DialogHeader>
        <ProdutoForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );

  return (
    <OptimizedRoleGuard>
      <PageContainer
        title="Produtos"
        subtitle="Catálogo de produtos e estoque"
        actions={pageActions}
      >
        {/* Barra de Busca e Filtros - Padrão Clientes */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm mb-6 sticky top-0 z-10">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar produto por nome, marca ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 p-1 lg:p-0">
            <div className="w-[160px]">
              <MultiSelect
                options={categorias}
                selected={selectedCategorias}
                onChange={setSelectedCategorias}
                placeholder="Categorias"
                className="h-10"
              />
            </div>

            <div className="w-[160px]">
              <MultiSelect
                options={fornecedores}
                selected={selectedFornecedores}
                onChange={setSelectedFornecedores}
                placeholder="Fornecedores"
                className="h-10"
              />
            </div>

            <div className="flex items-center gap-4 px-3 border-l border-border/50 h-8 shrink-0">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-inactive-produtos"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>
              <Label htmlFor="show-inactive-produtos" className="cursor-pointer text-xs font-bold uppercase text-muted-foreground whitespace-nowrap tracking-wider">
                Arquivados
              </Label>
            </div>
          </div>
        </div>
        {/* Dialogs */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>Atualize as informações do produto</DialogDescription>
            </DialogHeader>
            <ProdutoForm
              onSuccess={handleSuccess}
              produto={selectedProduto}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Produto</DialogTitle>
            </DialogHeader>
            {selectedProduto && (
              <ProdutoView produto={selectedProduto} onClose={() => setViewDialogOpen(false)} />
            )}
          </DialogContent>
        </Dialog>

        {/* Tabela - Desktop (Hidden on Mobile/Tablet) */}
        <div className="hidden xl:block rounded-2xl border border-border/30 bg-card shadow-2xl overflow-x-auto">
          <Table className="bg-card">
            <TableHeader className="bg-card border-b border-border">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider py-4 pl-6 w-[35%]">Produto</TableHead>
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider py-4 w-[15%]">Marca / Cat.</TableHead>
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider py-4 w-[20%]">Fornecedor</TableHead>
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-center py-4 w-32">Estoques</TableHead>
                {!hidePrices && (
                  <>
                    <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4">Custo</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4">Venda</TableHead>
                  </>
                )}
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4 pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border/20">
                  <TableCell colSpan={hidePrices ? 5 : 7} className="h-24 text-center text-muted-foreground">
                    Carregando produtos...
                  </TableCell>
                </TableRow>
              ) : filteredProdutos.length === 0 ? (
                <TableRow className="border-border/20">
                  <TableCell colSpan={hidePrices ? 5 : 7} className="h-32 text-center text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((produto) => {
                  const isFornecedorProducao = (produto as any).fornecedores?.id === FORNECEDOR_PRODUCAO_ID || produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
                  const fornecedorNome = (produto as any).fornecedores?.nome || "-";

                  return (
                    <TableRow
                      key={produto.id}
                      className={cn(
                        "bg-card hover:bg-muted/50 transition-colors border-b border-border/40 group cursor-pointer",
                        !produto.ativo && "opacity-60 grayscale"
                      )}
                      onClick={() => handleView(produto)}
                    >
                      {/* 1. Nome do Produto - Expandido */}
                      <TableCell className="pl-6 py-4 max-w-[450px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-bold text-sm text-foreground uppercase tracking-tight truncate cursor-default">
                                {produto.nome}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/10">
                              <p className="text-xs">{produto.nome}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* 2. Marca / Categoria - Reduzido */}
                      <TableCell className="py-4 max-w-[120px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col truncate cursor-default">
                                <span className="font-bold text-xs text-foreground uppercase truncate">
                                  {produto.marca}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase truncate">
                                  {produto.tipo}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/10">
                              <p className="text-xs font-bold">{produto.marca}</p>
                              <p className="text-[10px] opacity-70">{produto.tipo}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* 3. Fornecedor - Reduzido */}
                      <TableCell className="py-4 text-xs text-muted-foreground uppercase max-w-[160px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate cursor-help">
                                {fornecedorNome}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/10">
                              <p className="text-xs">{fornecedorNome}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* 4. Estoques */}
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center gap-3">
                          {[
                            { label: 'Gar.', val: produto.estoque_garrafas },
                            { label: 'Tam.', val: produto.estoque_tampas },
                            { label: 'Rót.', val: produto.estoque_rotulos }
                          ].map((e, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <span className="text-[9px] text-muted-foreground uppercase mb-1">{e.label}</span>
                              <span className={cn("text-xs font-medium", !isFornecedorProducao ? "text-muted-foreground/50" : (e.val || 0) < 100 ? "text-amber-500" : "text-emerald-500")}>
                                {isFornecedorProducao ? (e.val ?? "—") : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      {/* 5. Preço de Custo */}
                      {!hidePrices && (
                        <TableCell className="text-right py-4 tabular-nums">
                          <span className="font-bold text-[12px] text-muted-foreground">
                            {formatCurrencyEUR(produto.preco_custo || 0)}
                          </span>
                        </TableCell>
                      )}

                      {/* 6. Preço de Venda */}
                      {!hidePrices && (
                        <TableCell className="text-right py-4 tabular-nums">
                          <span className="font-bold text-sm text-primary">
                            {formatCurrencyEUR(produto.preco_venda)}
                          </span>
                        </TableCell>
                      )}

                      {/* 7. Ações */}
                      <TableCell className="pr-6 py-4">
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <ProdutoActions
                            produto={produto}
                            onEdit={() => handleEdit(produto)}
                            onView={() => handleView(produto)}
                            onRefresh={fetchProdutos}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile / Tablet View (Cards) */}
        <div className="xl:hidden flex flex-col gap-4 pb-20">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando produtos...
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border/30">
              Nenhum produto encontrado.
            </div>
          ) : (
            filteredProdutos.map((produto) => {
              const isFornecedorProducao = (produto as any).fornecedores?.id === FORNECEDOR_PRODUCAO_ID || produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
              const fornecedorNome = (produto as any).fornecedores?.nome || "-";

              return (
                <div
                  key={produto.id}
                  className={cn(
                    "bg-card rounded-xl border border-border/30 shadow-sm p-5 flex flex-col gap-5 active:scale-[0.99] transition-transform",
                    !produto.ativo && "opacity-60 grayscale"
                  )}
                  onClick={() => handleView(produto)}
                >
                  {/* Header: Nome + Ações */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="font-bold text-base sm:text-lg text-foreground uppercase leading-tight">
                        {produto.nome}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold bg-muted/50 px-2 py-1 rounded-md text-muted-foreground uppercase border border-border/20">
                          {produto.marca}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {produto.tipo}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} className="scale-110 origin-top-right">
                      <ProdutoActions
                        produto={produto}
                        onEdit={() => handleEdit(produto)}
                        onView={() => handleView(produto)}
                        onRefresh={fetchProdutos}
                      />
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border/10 pb-4">
                    <Truck className="h-4 w-4 text-muted-foreground/70" />
                    <span className="uppercase truncate tracking-wide">{fornecedorNome}</span>
                  </div>

                  {/* Dados: Estoque e Preços */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Estoques */}
                    <div className="bg-muted/20 rounded-xl p-3 border border-border/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center border-b border-border/10 pb-2">
                        Estoque
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Garrafa', val: produto.estoque_garrafas },
                          { label: 'Tampa', val: produto.estoque_tampas },
                          { label: 'Rótulo', val: produto.estoque_rotulos }
                        ].map((e, i) => (
                          <div key={i} className="flex flex-col items-center justify-center p-1">
                            <span className={cn("text-base sm:text-lg font-bold leading-none mb-1", !isFornecedorProducao ? "text-muted-foreground/30" : (e.val || 0) < 100 ? "text-amber-500" : "text-emerald-500")}>
                              {isFornecedorProducao ? (e.val ?? "-") : "-"}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground/80 uppercase text-center leading-tight">{e.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preços */}
                    {!hidePrices && (
                      <div className="bg-muted/20 rounded-xl p-3 border border-border/10 flex flex-col justify-between text-right">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 border-b border-border/10 pb-2">
                            Valor de Venda
                          </span>
                          <span className="text-lg sm:text-xl font-bold text-primary block">
                            {formatCurrencyEUR(produto.preco_venda)}
                          </span>
                        </div>
                        {produto.preco_custo > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/5">
                            <span className="text-[10px] text-muted-foreground uppercase">
                              Custo: <span className="font-medium text-foreground/70">{formatCurrencyEUR(produto.preco_custo)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </PageContainer>
    </OptimizedRoleGuard>
  );
}
