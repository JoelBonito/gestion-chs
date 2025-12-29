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
  const userEmail = user?.email?.toLowerCase();
  const isHam = userEmail === "ham@admin.com";
  const FORNECEDOR_PRODUCAO_ID = "b8f995d2-47dc-4c8f-9779-ce21431f5244";

  // i18n
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string, fr: string }> = {
      "Produtos": { pt: "Produtos", fr: "Produits" },
      "Gestão de catálogo e lista de preços": { pt: "Gestão de catálogo e lista de preços", fr: "Gestion du catalogue et liste de prix" },
      "Novo Produto": { pt: "Novo Produto", fr: "Nouveau Produit" },
      "Buscar produtos...": { pt: "Buscar produtos...", fr: "Recherche de produits..." },
      "Categorias": { pt: "Categorias", fr: "Catégories" },
      "Fornecedores": { pt: "Fornecedores", fr: "Fournisseurs" },
      "Mostrar Inativos": { pt: "Mostrar Inativos", fr: "Afficher Inactifs" },
      "Produto": { pt: "Produto", fr: "Produit" },
      "Resumo": { pt: "Resumo", fr: "Résumé" },
      "Fornecedor": { pt: "Fornecedor", fr: "Fournisseur" },
      "Estoques": { pt: "Estoques", fr: "Stocks" },
      "Preço de Custo": { pt: "Preço de Custo", fr: "Prix de Revient" },
      "Preço de Venda": { pt: "Preço de Venda", fr: "Prix de Vente" },
      "Ações": { pt: "Ações", fr: "Actions" },
      "Carregando produtos...": { pt: "Carregando produtos...", fr: "Chargement des produits..." },
      "Nenhum produto encontrado.": { pt: "Nenhum produto encontrado.", fr: "Aucun produit trouvé." },
      "Estoque": { pt: "Estoque", fr: "Stock" },
      "Valor de Venda": { pt: "Valor de Venda", fr: "Prix de Vente" },
      "Custo:": { pt: "Custo:", fr: "Coût:" },
      "Garrafa": { pt: "Garrafa", fr: "Bouteille" },
      "Tampa": { pt: "Tampa", fr: "Bouchon" },
      "Rótulo": { pt: "Rótulo", fr: "Étiquette" },
      "Gar.": { pt: "Gar.", fr: "Bout." },
      "Tam.": { pt: "Tam.", fr: "Bouch." },
      "Rót.": { pt: "Rót.", fr: "Ét." },
      "Detalhes do Produto": { pt: "Detalhes do Produto", fr: "Détails du Produit" },
      "Editar Produto": { pt: "Editar Produto", fr: "Modifier le Produit" },
      "Atualize as informações do produto": { pt: "Atualize as informações do produto", fr: "Mettez à jour les informations du produit" },
      "Novo": { pt: "Novo", fr: "Nouveau" },
    };
    return d[k]?.[lang] || k;
  };

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
    } catch (error: any) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditDialogOpen(false);
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
      const matchesSearch =
        produto.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (produto.marca || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (produto.tipo || "").toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesCategory =
        selectedCategorias.length === 0 || (produto.tipo && selectedCategorias.includes(produto.tipo));

      const matchesFornecedor =
        selectedFornecedores.length === 0 || (produto.fornecedor_id && selectedFornecedores.includes(produto.fornecedor_id));

      const matchesStatus = showInactive ? true : produto.ativo;

      return matchesSearch && matchesCategory && matchesFornecedor && matchesStatus;
    });
  }, [produtos, debouncedSearch, showInactive, selectedCategorias, selectedFornecedores]);


  return (
    <OptimizedRoleGuard>
      <PageContainer
        title={t("Produtos")}
        subtitle={t("Gestão de catálogo e lista de preços")}
        actions={
          !isHam && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t("Novo Produto")}</span>
                  <span className="sm:hidden">{t("Novo Produto")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle>{t("Novo Produto")}</DialogTitle>
                  <DialogDescription>
                    {t("Gestão de catálogo e lista de preços")}
                  </DialogDescription>
                </DialogHeader>
                <ProdutoForm onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          )
        }
      >
        {/* Barra de Busca e Filtros - Padrão Clientes */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm mb-6 sticky top-0 z-10">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t("Buscar produtos...")}
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
                placeholder={t("Categorias")}
                className="h-10"
              />
            </div>

            <div className="w-[160px]">
              <MultiSelect
                options={fornecedores}
                selected={selectedFornecedores}
                onChange={setSelectedFornecedores}
                placeholder={t("Fornecedores")}
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
                {t("Mostrar Inativos")}
              </Label>
            </div>
          </div>
        </div>
        {/* Dialogs */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>{t("Editar Produto")}</DialogTitle>
              <DialogDescription>{t("Atualize as informações do produto")}</DialogDescription>
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
              <DialogTitle>{t("Detalhes do Produto")}</DialogTitle>
            </DialogHeader>
            {selectedProduto && (
              <ProdutoView produto={selectedProduto} onClose={() => setViewDialogOpen(false)} />
            )}
          </DialogContent>
        </Dialog>

        {/* Tabela - Desktop (Hidden on Mobile/Tablet) */}
        <div className="hidden xl:block rounded-2xl border border-border/30 bg-card shadow-2xl overflow-x-auto">
          <Table className="bg-card w-full border-collapse table-fixed min-w-[950px]">
            <TableHeader className="bg-card border-b border-border">
              <TableRow className="hover:bg-transparent border-none">
                {/* Produto */}
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider py-4 pl-6 w-[28%]">{t("Produto")}</TableHead>

                {/* Marca Categoria */}
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider py-4 w-[16%]">
                  <div className="flex flex-col gap-0.5">
                    <span className="leading-tight">{t("Marca")}</span>
                    <span className="leading-tight">{t("Categoria")}</span>
                  </div>
                </TableHead>

                {/* Fornecedor */}
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider py-4 w-[18%]">{t("Fornecedor")}</TableHead>

                {/* Estoques */}
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-center py-4 w-[14%]">{t("Estoques")}</TableHead>

                {/* Colunas Condicionais de Preço */}
                {!isHam && !hidePrices && (
                  <>
                    <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4 w-[9%]">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="leading-tight">{t("Preço")}</span>
                        <span className="leading-tight">{t("Custo")}</span>
                      </div>
                    </TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4 w-[9%]">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="leading-tight">{t("Preço")}</span>
                        <span className="leading-tight">{t("Venda")}</span>
                      </div>
                    </TableHead>
                  </>
                )}

                {isHam && (
                  <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4 w-[12%]">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="leading-tight">{t("Preço")}</span>
                      <span className="leading-tight">{t("Venda")}</span>
                    </div>
                  </TableHead>
                )}

                {/* Ações */}
                <TableHead className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider text-right py-4 pr-6 w-[10%]">{t("Ações")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border/20">
                  <TableCell colSpan={isHam ? 6 : hidePrices ? 5 : 7} className="h-24 text-center text-muted-foreground">
                    {t("Carregando produtos...")}
                  </TableCell>
                </TableRow>
              ) : filteredProdutos.length === 0 ? (
                <TableRow className="border-border/20">
                  <TableCell colSpan={isHam ? 6 : hidePrices ? 5 : 7} className="h-32 text-center text-muted-foreground">
                    {t("Nenhum produto encontrado.")}
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
                      {/* 1. Nome do Produto - Sem Foto */}
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col gap-1 min-w-0">
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
                          <div className="flex items-center gap-2">
                            {produto.new_product && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] h-4 px-1 leading-none uppercase font-black">{t("Novo")}</Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground/70 uppercase font-black tracking-wider truncate">
                              {produto.marca}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Marca e Categoria */}
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground uppercase truncate">
                            {produto.marca}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 uppercase font-medium">
                            {produto.tipo}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Fornecedor */}
                      <TableCell className="py-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-black tracking-wide truncate cursor-help">
                                <Truck className="h-3 w-3 shrink-0 opacity-40" />
                                <span className="truncate">{fornecedorNome}</span>
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
                            { label: t('Gar.'), val: produto.estoque_garrafas },
                            { label: t('Tam.'), val: produto.estoque_tampas },
                            { label: t('Rót.'), val: produto.estoque_rotulos }
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
                      {!isHam && !hidePrices && (
                        <TableCell className="text-right py-4 tabular-nums">
                          <span className="font-bold text-[12px] text-muted-foreground">
                            {formatCurrencyEUR(produto.preco_custo || 0)}
                          </span>
                        </TableCell>
                      )}

                      {/* 6. Preço de Venda */}
                      {(!hidePrices || isHam) && (
                        <TableCell className="text-right py-4 tabular-nums">
                          <span className="font-bold text-sm text-primary">
                            {formatCurrencyEUR(produto.preco_venda)}
                          </span>
                        </TableCell>
                      )}

                      {/* 7. Ações */}
                      <TableCell className="pr-6 py-4 text-right">
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
        <div className="xl:hidden flex flex-col gap-3 pb-20">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("Carregando produtos...")}
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border/30">
              {t("Nenhum produto encontrado.")}
            </div>
          ) : (
            filteredProdutos.map((produto) => {
              const isFornecedorProducao = (produto as any).fornecedores?.id === FORNECEDOR_PRODUCAO_ID || produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
              const fornecedorNome = (produto as any).fornecedores?.nome || "-";

              return (
                <div
                  key={produto.id}
                  className={cn(
                    "bg-card rounded-xl border border-border/30 shadow-sm p-4 flex flex-col gap-3 hover:border-primary/30 transition-all cursor-pointer group",
                    !produto.ativo && "opacity-60 grayscale"
                  )}
                  onClick={() => handleView(produto)}
                >
                  {/* Linha Superior: Nome e Ações */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-foreground uppercase truncate tracking-tight">
                        {produto.nome}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground/70 uppercase truncate">
                          {produto.marca}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] text-muted-foreground/50 uppercase truncate">
                          {produto.tipo}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0 -mt-1 -mr-1">
                      <ProdutoActions
                        produto={produto}
                        onEdit={() => handleEdit(produto)}
                        onView={() => handleView(produto)}
                        onRefresh={fetchProdutos}
                        className="scale-90"
                      />
                    </div>
                  </div>

                  {/* Linha Central: Fornecedor */}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 py-2 border-y border-border/5">
                    <Truck className="h-3 w-3 shrink-0 opacity-50" />
                    <span className="uppercase truncate">{fornecedorNome}</span>
                  </div>

                  {/* Linha Inferior: Estoques e Valor */}
                  <div className="flex items-center justify-between gap-4 mt-1">
                    {/* Mini Estoques Horizontal */}
                    <div className="flex items-center gap-4">
                      {[
                        { label: t('Gar.'), val: produto.estoque_garrafas },
                        { label: t('Tam.'), val: produto.estoque_tampas },
                        { label: t('Rót.'), val: produto.estoque_rotulos }
                      ].map((e, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[8px] text-muted-foreground uppercase leading-none mb-1">{e.label}</span>
                          <span className={cn("text-[11px] font-bold leading-none", !isFornecedorProducao ? "text-muted-foreground/30" : (e.val || 0) < 100 ? "text-amber-500" : "text-emerald-500")}>
                            {isFornecedorProducao ? (e.val ?? "-") : "-"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Preço de Venda Compacto */}
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                        {t("Venda")}
                      </div>
                      <div className="text-base font-bold text-primary leading-none">
                        {formatCurrencyEUR(produto.preco_venda)}
                      </div>
                    </div>
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
