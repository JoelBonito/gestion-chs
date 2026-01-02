import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, DollarSign, Paperclip, X, Truck, BarChart3 } from "lucide-react";
import { AttachmentManager } from "@/components/shared";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import { GlassCard } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Produto } from "@/types/database";

interface ProdutoWithFornecedor extends Produto {
  fornecedores?: { nome: string } | null;
}

export default function ProdutoView({ produto, onClose }: { produto: ProdutoWithFornecedor; onClose?: () => void }) {
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";

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
        </div>

        {/* Informações Financeiras & Estoque */}
        <div className="space-y-4">
          {(isHam || !hidePrices) && (
            <div className="bg-popover border-border/20 rounded-xl border p-5 shadow-sm">
              <div className="border-border/10 mb-3 flex items-center gap-2 border-b pb-3 text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                <DollarSign className="h-3.5 w-3.5" />
                <span>{t("Preços e Margens")}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={cn(
                    "bg-accent rounded-xl border border-emerald-500/20 p-4 shadow-sm transition-all hover:bg-emerald-500/5",
                    (isHam || hidePrices) && "col-span-2"
                  )}
                >
                  <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                    {t("Venda")}
                  </span>
                  <div className="mt-1 text-2xl font-bold text-emerald-500">
                    {formatCurrencyEUR(produto.preco_venda)}
                  </div>
                </div>

                {!isHam && !hidePrices && produto.preco_custo > 0 && (
                  <div className="bg-accent rounded-xl border border-orange-500/20 p-4 shadow-sm transition-all hover:bg-orange-500/5">
                    <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">
                      {t("Custo")}
                    </span>
                    <div className="mt-1 text-2xl font-bold text-orange-400">
                      {formatCurrencyEUR(produto.preco_custo)}
                    </div>
                  </div>
                )}
              </div>

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

          {/* Estoque Card - Se tiver dados */}
          {(produto.estoque_garrafas > 0 ||
            produto.estoque_tampas > 0 ||
            produto.estoque_rotulos > 0) && (
              <div className="bg-popover border-border/20 rounded-xl border p-5 shadow-sm">
                <div className="text-primary border-border/10 mb-3 flex items-center gap-2 border-b pb-3 text-[10px] font-bold tracking-widest uppercase">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>{t("Níveis de Estoque")}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-accent border-border/10 rounded-lg border p-2">
                    <div className="text-foreground text-lg font-bold">
                      {produto.estoque_garrafas || 0}
                    </div>
                    <div className="text-muted-foreground text-[9px] uppercase">{t("Garrafas")}</div>
                  </div>
                  <div className="bg-accent border-border/10 rounded-lg border p-2">
                    <div className="text-foreground text-lg font-bold">
                      {produto.estoque_tampas || 0}
                    </div>
                    <div className="text-muted-foreground text-[9px] uppercase">{t("Tampas")}</div>
                  </div>
                  <div className="bg-accent border-border/10 rounded-lg border p-2">
                    <div className="text-foreground text-lg font-bold">
                      {produto.estoque_rotulos || 0}
                    </div>
                    <div className="text-muted-foreground text-[9px] uppercase">{t("Rótulos")}</div>
                  </div>
                </div>
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
