import React from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, DollarSign, Paperclip, X } from "lucide-react";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useAuth } from "@/hooks/useAuth";

export default function ProdutoView({ produto, onClose }) {
  const { user } = useAuth();
  const isFelipe = user?.email?.toLowerCase() === "felipe@colaborador.com";
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold truncate">{produto.nome}</h2>
          <div className="flex items-center gap-2">
            <Badge variant={produto.ativo ? "default" : "secondary"}>
              {produto.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          {produto.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Criado em: {new Date(produto.created_at).toLocaleString()}
            </div>
          )}
          {produto.updated_at && produto.updated_at !== produto.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Atualizado em: {new Date(produto.updated_at).toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Botão Fechar */}
        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Fechar</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>Marca:</strong> {produto.marca || "Não informada"}
            </div>
            {produto.tipo && (
              <div>
                <strong>Tipo:</strong> {produto.tipo}
              </div>
            )}
            {produto.peso && (
              <div>
                <strong>Peso:</strong> {produto.peso}g
              </div>
            )}
            {produto.descricao && (
              <div>
                <strong>Descrição:</strong>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {produto.descricao}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>Preço de Venda:</strong>
              <div className="text-lg font-bold text-green-600">
                {formatCurrencyEUR(produto.preco_venda)}
              </div>
            </div>
            {!isFelipe && produto.preco_custo && (
              <div>
                <strong>Preço de Custo:</strong>
                <div className="text-lg font-semibold">
                  {formatCurrencyEUR(produto.preco_custo)}
                </div>
              </div>
            )}
            {!isFelipe && produto.preco_custo && produto.preco_venda && (
              <div>
                <strong>Margem:</strong>
                <div className="text-sm text-muted-foreground">
                  {(((produto.preco_venda - produto.preco_custo) / produto.preco_venda) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentManager
            entityType="produto"
            entityId={produto.id}
            onChanged={() => {
              // Opcional: callback para quando anexos mudarem
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
