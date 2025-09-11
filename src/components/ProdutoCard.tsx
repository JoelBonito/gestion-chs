import React, { useState } from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import ProdutoView from "@/components/ProdutoView";
import { ProdutoActions } from "@/components/ProdutoActions";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";

export default function ProdutoCard({ produto, onUpdate, onDelete, onToggleActive }) {
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { isCollaborator } = useIsCollaborator();

  const handleEdit = () => {
    setShowEdit(true);
  };

  const handleView = () => {
    setShowView(true);
  };

  return (
    <>
      <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{produto.nome}</h3>
            <p className="text-sm text-muted-foreground">{produto.marca}</p>
          </div>
          <Badge variant={produto.ativo ? "default" : "secondary"}>
            {produto.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <div className="font-bold text-lg">{formatCurrencyEUR(produto.preco_venda)}</div>
          {produto.tipo && (
            <p className="text-sm text-muted-foreground">Tipo: {produto.tipo}</p>
          )}
          {produto.peso && (
            <p className="text-sm text-muted-foreground">Peso: {produto.peso}g</p>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleView}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!isCollaborator && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {!isCollaborator && (
            <ProdutoActions
              produto={produto}
              onEdit={handleEdit}
              onRefresh={onUpdate}
            />
          )}
        </div>
      </div>

      {/* Modal de Visualização */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Produto</DialogTitle>
          </DialogHeader>
          <ProdutoView produto={produto} />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm
            produto={produto}
            isEditing={true}
            onSuccess={() => {
              setShowEdit(false);
              onUpdate();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
