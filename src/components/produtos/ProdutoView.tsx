import React, { useState, useCallback } from "react";
import { formatCurrencyEUR, formatCurrencyBRL, eurToBrl } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, DollarSign, Paperclip, Truck, BarChart3, Save, Loader2, Pencil } from "lucide-react";
import { AttachmentManager } from "@/components/shared";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices, FORNECEDOR_PRODUCAO_ID } from "@/lib/permissions";

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
      "Custo Produção": { pt: "Custo Produção", fr: "Coût de Production" },
      "Preço Custo": { pt: "Preço Custo", fr: "Prix Coût" },
      "Lucro Joel": { pt: "Lucro Joel", fr: "Profit Joel" },
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

              {/* Custo + Lucro Joel (condicional por fornecedor) */}
              {!isHam && !hidePrices && (() => {
                const isProducao = produto.fornecedor_id === FORNECEDOR_PRODUCAO_ID;

                const custoLabel = isProducao ? t("Custo Produção") : t("Preço Custo");
                const custoValue = isProducao ? produto.custo_producao : produto.preco_custo;
                const lucroValue = isProducao
                  ? produto.lucro_joel
                  : (produto.preco_venda - (produto.preco_custo || 0));

                const hasCusto = custoValue != null && custoValue > 0;
                const hasLucro = lucroValue != null && lucroValue > 0;

                if (!hasCusto && !hasLucro) return null;

                return (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {hasCusto && (
                      <div className="bg-accent rounded-xl border border-orange-500/20 p-3 shadow-sm">
                        <span className="text-[9px] font-bold tracking-wider text-orange-400 uppercase">
                          {custoLabel}
                        </span>
                        <div className="mt-1 text-lg font-bold tabular-nums text-orange-400">
                          {formatCurrencyEUR(custoValue!)}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
                          {formatCurrencyBRL(eurToBrl(custoValue!))}
                        </div>
                      </div>
                    )}
                    {hasLucro && (
                      <div className="bg-accent rounded-xl border border-emerald-500/20 p-3 shadow-sm">
                        <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase">
                          {t("Lucro Joel")}
                        </span>
                        <div className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
                          {formatCurrencyEUR(lucroValue!)}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
                          {formatCurrencyBRL(eurToBrl(lucroValue!))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
