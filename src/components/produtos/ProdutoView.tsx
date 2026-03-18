import React, { useState, useCallback } from "react";
import { formatCurrencyEUR, formatCurrencyBRL, eurToBrl } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, DollarSign, Paperclip, Truck, BarChart3, Save, Loader2, Pencil } from "lucide-react";
import { AttachmentManager } from "@/components/shared";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Produto } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProdutoWithFornecedor extends Produto {
  fornecedores?: { nome: string } | null;
}

export default function ProdutoView({ produto: initialProduto, onClose, onEdit }: { produto: ProdutoWithFornecedor; onClose?: () => void; onEdit?: () => void }) {
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";
  const [produto, setProduto] = useState(initialProduto);
  const [estoqueGarrafas, setEstoqueGarrafas] = useState(initialProduto.estoque_garrafas || 0);
  const [estoqueTampas, setEstoqueTampas] = useState(initialProduto.estoque_tampas || 0);
  const [estoqueRotulos, setEstoqueRotulos] = useState(initialProduto.estoque_rotulos || 0);
  const [savingEstoque, setSavingEstoque] = useState(false);

  const refreshProduto = useCallback(async () => {
    const { data } = await supabase
      .from("produtos")
      .select("*, fornecedores(id, nome)")
      .eq("id", produto.id)
      .single();
    if (data) setProduto(data as any);
  }, [produto.id]);

  const handleSaveEstoque = async () => {
    setSavingEstoque(true);
    try {
      const { error } = await supabase
        .from("produtos")
        .update({
          estoque_garrafas: estoqueGarrafas,
          estoque_tampas: estoqueTampas,
          estoque_rotulos: estoqueRotulos,
        })
        .eq("id", produto.id);
      if (error) throw error;
      toast.success("Estoque atualizado");
      refreshProduto();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar estoque");
    } finally {
      setSavingEstoque(false);
    }
  };

  const estoqueChanged =
    estoqueGarrafas !== (produto.estoque_garrafas || 0) ||
    estoqueTampas !== (produto.estoque_tampas || 0) ||
    estoqueRotulos !== (produto.estoque_rotulos || 0);

  // i18n
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      "Detalhes do Produto": { pt: "Detalhes do Produto", fr: "Détails du Produit" },
      "Fornecedor:": { pt: "Fornecedor:", fr: "Fournisseur :" },
      "Peso:": { pt: "Peso:", fr: "Poids :" },
      "Criado em:": { pt: "Criado em:", fr: "Créé le :" },
      Descrição: { pt: "Descrição", fr: "Description" },
      "Preços e Margens": { pt: "Preços e Margens", fr: "Prix et Marges" },
      Venda: { pt: "Venda", fr: "Vente" },
      Custo: { pt: "Custo", fr: "Coût" },
      "Margem Estimada:": { pt: "Margem Estimada:", fr: "Marge Estimée :" },
      "Nonato": { pt: "Nonato", fr: "Nonato" },
      "Lucro Nonato:": { pt: "Lucro Nonato:", fr: "Profit Nonato :" },
      "Níveis de Estoque": { pt: "Níveis de Estoque", fr: "Niveaux de Stock" },
      Garrafas: { pt: "Garrafas", fr: "Bouteilles" },
      Tampas: { pt: "Tampas", fr: "Bouchons" },
      Rótulos: { pt: "Rótulos", fr: "Étiquettes" },
      "Arquivos e Anexos": { pt: "Arquivos e Anexos", fr: "Fichiers et Pièces Jointes" },
      Ativo: { pt: "Ativo", fr: "Actif" },
      Inativo: { pt: "Inativo", fr: "Inactif" },
      "Não informado": { pt: "Não informado", fr: "Non renseigné" },
    };
    return d[k]?.[lang] || k;
  };

  const fornecedorNome = produto.fornecedores?.nome || t("Não informado");

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex flex-1 items-start gap-4">
          <div className="space-y-1">
            <h2 className="text-foreground text-xl leading-tight font-bold uppercase sm:text-2xl">
              {produto.nome}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground border-border/20 bg-card">
                {produto.marca}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-popover text-muted-foreground border-border/10"
              >
                {produto.tipo}
              </Badge>
              <Badge
                variant={produto.ativo ? "default" : "destructive"}
                className={
                  produto.ativo ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400" : ""
                }
              >
                {produto.ativo ? t("Ativo") : t("Inativo")}
              </Badge>
            </div>
          </div>
        </div>
        {onEdit && !isHam && (
          <Button
            variant="gradient"
            size="sm"
            onClick={onEdit}
            className="h-9 px-6 text-xs font-bold tracking-widest uppercase shadow-md transition-all active:scale-95"
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Detalhes Básicos */}
        <div className="bg-popover border-border/20 flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
          <div className="border-border/10 mb-1 flex items-center gap-2 border-b pb-3 text-[10px] font-bold tracking-widest text-cyan-500 uppercase">
            <Package className="h-3.5 w-3.5" />
            <span>{t("Detalhes do Produto")}</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground text-xs font-medium">{t("Fornecedor:")}</span>
              <div className="col-span-2 flex items-center gap-1.5 truncate">
                <Truck className="text-muted-foreground h-3 w-3" />
                <span className="text-foreground font-semibold">{fornecedorNome}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground text-xs font-medium">{t("Peso:")}</span>
              <span className="text-foreground col-span-2">
                {produto.size_weight || produto.peso
                  ? (produto.size_weight || produto.peso) + "g"
                  : "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground text-xs font-medium">{t("Criado em:")}</span>
              <span className="text-muted-foreground col-span-2 text-xs">
                {new Date(produto.created_at).toLocaleDateString(isHam ? "fr-FR" : "pt-BR")}
              </span>
            </div>
          </div>

          {produto.descricao && (
            <div className="border-border/30 mt-2 border-t pt-3">
              <span className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase">
                {t("Descrição")}
              </span>
              <p className="text-foreground/80 max-h-[100px] overflow-y-auto pr-2 text-xs leading-relaxed">
                {produto.descricao}
              </p>
            </div>
          )}

          {/* Estoque editável */}
          <div className="border-border/30 mt-2 border-t pt-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest text-cyan-500 uppercase">
              <BarChart3 className="h-3 w-3" />
              <span>{t("Níveis de Estoque")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-muted-foreground text-[9px] font-bold uppercase">{t("Garrafas")}</label>
                <Input
                  type="number"
                  min="0"
                  value={estoqueGarrafas || ""}
                  onChange={(e) => setEstoqueGarrafas(parseInt(e.target.value) || 0)}
                  className="bg-accent border-border/50 h-9 text-center text-sm tabular-nums focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground text-[9px] font-bold uppercase">{t("Tampas")}</label>
                <Input
                  type="number"
                  min="0"
                  value={estoqueTampas || ""}
                  onChange={(e) => setEstoqueTampas(parseInt(e.target.value) || 0)}
                  className="bg-accent border-border/50 h-9 text-center text-sm tabular-nums focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground text-[9px] font-bold uppercase">{t("Rótulos")}</label>
                <Input
                  type="number"
                  min="0"
                  value={estoqueRotulos || ""}
                  onChange={(e) => setEstoqueRotulos(parseInt(e.target.value) || 0)}
                  className="bg-accent border-border/50 h-9 text-center text-sm tabular-nums focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
            </div>
            {estoqueChanged && (
              <Button
                size="sm"
                onClick={handleSaveEstoque}
                disabled={savingEstoque}
                className="mt-2 w-full bg-cyan-600 text-white hover:bg-cyan-700"
              >
                {savingEstoque ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                Salvar Estoque
              </Button>
            )}
          </div>
        </div>

        {/* Informações Financeiras & Estoque */}
        <div className="space-y-4">
          {(isHam || !hidePrices) && (
            <div className="bg-popover border-border/20 rounded-xl border p-5 shadow-sm">
              <div className="border-border/10 mb-3 flex items-center gap-2 border-b pb-3 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{t("Preços e Margens")}</span>
              </div>

              {/* Preço Venda - Hero */}
              <div className="bg-accent rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 text-center shadow-sm">
                <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                  {t("Venda")}
                </span>
                <div className="mt-1 text-3xl font-bold text-emerald-500">
                  {formatCurrencyEUR(produto.preco_venda)}
                </div>
                <div className="text-muted-foreground mt-1 text-sm font-medium tabular-nums">
                  {formatCurrencyBRL(eurToBrl(produto.preco_venda))}
                </div>
              </div>

              {!isHam && !hidePrices && (() => {
                const priceTypes = [
                  { label: "Custo", price: produto.preco_custo, color: "orange", textCls: "text-orange-400", borderCls: "border-orange-500/20" },
                  { label: "Tabela", price: produto.preco_tabela, color: "amber", textCls: "text-amber-500", borderCls: "border-amber-500/20" },
                  { label: "50/50", price: produto.preco_nonato, color: "violet", textCls: "text-violet-500", borderCls: "border-violet-500/20" },
                  { label: "+25%", price: produto.preco_plus25, color: "rose", textCls: "text-rose-500", borderCls: "border-rose-500/20" },
                ];

                const profitTypes = [
                  { label: "Lucro Real", getValue: () => produto.preco_venda - produto.preco_custo, requires: produto.preco_custo > 0, textCls: "text-emerald-500", borderCls: "border-emerald-500/20" },
                  { label: "Lucro Tabela", getValue: () => produto.preco_venda - (produto.preco_tabela || 0), requires: (produto.preco_tabela || 0) > 0, textCls: "text-amber-400", borderCls: "border-amber-500/20" },
                  { label: "Lucro 50/50", getValue: () => (produto.preco_venda - (produto.preco_nonato || 0)) / 2, requires: (produto.preco_nonato || 0) > 0, textCls: "text-violet-400", borderCls: "border-violet-500/20" },
                  { label: "Lucro +25%", getValue: () => produto.preco_venda - (produto.preco_plus25 || 0), requires: (produto.preco_plus25 || 0) > 0, textCls: "text-rose-400", borderCls: "border-rose-500/20" },
                ];

                const activePrices = priceTypes.filter((pt) => pt.price != null && pt.price > 0);
                const activeProfits = profitTypes.filter((pt) => pt.requires && produto.preco_venda > 0);

                return (
                  <>
                    {/* Row: All prices side by side */}
                    {activePrices.length > 0 && (
                      <div className={cn("mt-4 grid gap-3", activePrices.length <= 2 ? "grid-cols-2" : "grid-cols-4")}>
                        {activePrices.map((pt) => (
                          <div key={pt.label} className={cn("bg-accent rounded-xl border p-3 shadow-sm", pt.borderCls)}>
                            <span className={cn("text-[9px] font-bold tracking-wider uppercase", pt.textCls)}>
                              {pt.label}
                            </span>
                            <div className={cn("mt-1 text-lg font-bold tabular-nums", pt.textCls)}>
                              {formatCurrencyEUR(pt.price!)}
                            </div>
                            <div className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
                              {formatCurrencyBRL(eurToBrl(pt.price!))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Row: All profits side by side */}
                    {activeProfits.length > 0 && (
                      <div className={cn("mt-3 grid gap-3", activeProfits.length <= 2 ? "grid-cols-2" : "grid-cols-4")}>
                        {activeProfits.map((pt) => {
                          const lucro = pt.getValue();
                          return (
                            <div key={pt.label} className={cn("rounded-xl border p-3", pt.borderCls, lucro >= 0 ? "bg-accent" : "bg-red-500/5 border-red-500/20")}>
                              <span className={cn("text-[9px] font-bold tracking-wider uppercase", lucro >= 0 ? pt.textCls : "text-red-500")}>
                                {pt.label}
                              </span>
                              <div className={cn("mt-1 text-lg font-bold tabular-nums", lucro >= 0 ? pt.textCls : "text-red-500")}>
                                {formatCurrencyEUR(lucro)}
                              </div>
                              <div className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
                                {formatCurrencyBRL(eurToBrl(lucro))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {!isHam && !hidePrices && produto.preco_venda > 0 && produto.preco_custo > 0 && (
                <div className="bg-accent border-border/10 mt-4 flex items-center justify-between rounded-xl border p-3 text-xs shadow-inner">
                  <span className="text-muted-foreground font-medium">{t("Margem Estimada:")}</span>
                  <span className="text-foreground text-lg font-bold">
                    {(
                      ((produto.preco_venda - produto.preco_custo) / produto.preco_venda) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Anexos */}
      <div className="bg-popover border-border/20 rounded-xl border p-5 shadow-sm">
        <div className="text-foreground border-border/10 mb-3 flex items-center gap-2 border-b pb-3 text-[10px] font-bold tracking-widest uppercase">
          <Paperclip className="h-3.5 w-3.5" />
          <span>{t("Arquivos e Anexos")}</span>
        </div>
        <AttachmentManager
          entityType="produto"
          entityId={produto.id}
          onChanged={() => { }}
          useTertiaryLayer={true}
        />
      </div>
    </div>
  );
}
