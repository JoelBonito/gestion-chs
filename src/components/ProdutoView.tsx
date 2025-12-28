import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, DollarSign, Paperclip, X, Truck, BarChart3 } from "lucide-react";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";
import { GlassCard } from "@/components/GlassCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProdutoView({ produto, onClose }: { produto: any, onClose?: () => void }) {
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);

  const fornecedorNome = produto.fornecedores?.nome || "Não informado";

  return (
    <div className="space-y-6">
      {/* Header com Avatar e Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-16 w-16 rounded-xl border-2 border-border/50 bg-white shadow-sm">
            <AvatarImage src={produto.imagem_url || ""} alt={produto.nome} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xl font-bold uppercase">
              {produto.nome.substring(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold uppercase leading-tight text-foreground">{produto.nome}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground border-border/20 bg-card">
                {produto.marca}
              </Badge>
              <Badge variant="secondary" className="bg-popover text-muted-foreground border-border/10">
                {produto.tipo}
              </Badge>
              <Badge variant={produto.ativo ? "default" : "destructive"} className={produto.ativo ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : ""}>
                {produto.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detalhes Básicos */}
        <div className="p-5 flex flex-col gap-4 bg-popover border border-border/20 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase text-[10px] tracking-widest border-b border-border/10 pb-3 mb-1">
            <Package className="h-3.5 w-3.5" />
            <span>Detalhes do Produto</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground font-medium text-xs">Fornecedor:</span>
              <div className="col-span-2 flex items-center gap-1.5 truncate">
                <Truck className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground font-semibold">{fornecedorNome}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground font-medium text-xs">Peso:</span>
              <span className="col-span-2 text-foreground">
                {produto.size_weight || produto.peso ? (produto.size_weight || produto.peso) + "g" : "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground font-medium text-xs">Criado em:</span>
              <span className="col-span-2 text-muted-foreground text-xs">
                {new Date(produto.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {produto.descricao && (
            <div className="mt-2 pt-3 border-t border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Descrição</span>
              <p className="text-xs text-foreground/80 leading-relaxed max-h-[100px] overflow-y-auto pr-2">
                {produto.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Informações Financeiras & Estoque */}
        <div className="space-y-4">
          {!hidePrices && (
            <div className="p-5 bg-popover border border-border/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase text-[10px] tracking-widest border-b border-border/10 pb-3 mb-3">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Preços e Margens</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-accent border border-emerald-500/20 shadow-sm transition-all hover:bg-emerald-500/5">
                  <span className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider">Venda</span>
                  <div className="text-2xl font-bold text-emerald-500 mt-1">
                    {formatCurrencyEUR(produto.preco_venda)}
                  </div>
                </div>

                {produto.preco_custo > 0 && (
                  <div className="p-4 rounded-xl bg-accent border border-orange-500/20 shadow-sm transition-all hover:bg-orange-500/5">
                    <span className="text-[10px] uppercase text-orange-400 font-bold tracking-wider">Custo</span>
                    <div className="text-2xl font-bold text-orange-400 mt-1">
                      {formatCurrencyEUR(produto.preco_custo)}
                    </div>
                  </div>
                )}
              </div>

              {produto.preco_venda > 0 && produto.preco_custo > 0 && (
                <div className="mt-4 flex items-center justify-between text-xs p-3 bg-accent border border-border/10 rounded-xl shadow-inner">
                  <span className="text-muted-foreground font-medium">Margem Estimada:</span>
                  <span className="font-bold text-foreground text-lg">
                    {(((produto.preco_venda - produto.preco_custo) / produto.preco_venda) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Estoque Card - Se tiver dados */}
          {(produto.estoque_garrafas > 0 || produto.estoque_tampas > 0 || produto.estoque_rotulos > 0) && (
            <div className="p-5 bg-popover border border-border/20 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest border-b border-border/10 pb-3 mb-3">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Níveis de Estoque</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-accent p-2 rounded-lg border border-border/10">
                  <div className="text-lg font-bold text-foreground">{produto.estoque_garrafas || 0}</div>
                  <div className="text-[9px] uppercase text-muted-foreground">Garrafas</div>
                </div>
                <div className="bg-accent p-2 rounded-lg border border-border/10">
                  <div className="text-lg font-bold text-foreground">{produto.estoque_tampas || 0}</div>
                  <div className="text-[9px] uppercase text-muted-foreground">Tampas</div>
                </div>
                <div className="bg-accent p-2 rounded-lg border border-border/10">
                  <div className="text-lg font-bold text-foreground">{produto.estoque_rotulos || 0}</div>
                  <div className="text-[9px] uppercase text-muted-foreground">Rótulos</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anexos */}
      <div className="p-5 bg-popover border border-border/20 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-foreground font-bold uppercase text-[10px] tracking-widest border-b border-border/10 pb-3 mb-3">
          <Paperclip className="h-3.5 w-3.5" />
          <span>Arquivos e Anexos</span>
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
