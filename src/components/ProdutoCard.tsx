import React, { useState } from "react";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Paperclip, Trash2 } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import ProdutoView from "@/components/ProdutoView";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAttachments } from "@/hooks/useAttachments";
import { IconWithBadge } from "@/components/ui/icon-with-badge";
import { useAuth } from "@/hooks/useAuth";
import { shouldHidePrices } from "@/lib/permissions";

export default function ProdutoCard({ produto, onUpdate, onDelete, onToggleActive }) {
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const { isCollaborator } = useIsCollaborator();
  const { attachments } = useAttachments("produto", produto.id);
  const { user } = useAuth();
  const hidePrices = shouldHidePrices(user);

  const handleEdit = () => {
    setShowEdit(true);
  };

  const handleView = () => {
    setShowView(true);
  };

  const handleAttachments = () => {
    setShowAttachments(true);
  };

  return (
    <>
      <div className="bg-card border border-border/10 rounded-xl p-4 space-y-3 hover:shadow-md hover:border-primary/50 transition-all duration-300">
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
          {!hidePrices && (
            <div className="font-bold text-lg">{formatCurrencyEUR(produto.preco_venda)}</div>
          )}
          {produto.tipo && (
            <p className="text-sm text-muted-foreground">Tipo: {produto.tipo}</p>
          )}
          {produto.peso && (
            <p className="text-sm text-muted-foreground">Peso: {produto.peso}g</p>
          )}
        </div>

        <div className="flex justify-end items-center pt-2 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleView}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleAttachments}
            className="h-8 w-8"
          >
            <IconWithBadge
              icon={<Paperclip className="h-4 w-4" />}
              count={attachments?.length || 0}
            />
          </Button>

          {!isCollaborator && !hidePrices && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {!isCollaborator && !hidePrices && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Excluir "{produto.nome}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-popover border-border/20">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(produto.id)}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Modal de Visualização */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Produto</DialogTitle>
            <DialogDescription>Detalhes do produto selecionado.</DialogDescription>
          </DialogHeader>
          <ProdutoView produto={produto} onClose={() => setShowView(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal de Anexos */}
      <Dialog open={showAttachments} onOpenChange={setShowAttachments}>
        <DialogContent className="max-w-4xl bg-background border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle>Anexos do Produto</DialogTitle>
            <DialogDescription>Adicione, visualize e remova arquivos do produto.</DialogDescription>
          </DialogHeader>
          <AttachmentManager
            entityType="produto"
            entityId={produto.id}
            onChanged={() => {
              // Opcional: recarregar dados se necessário
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-4xl bg-background border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Atualize as informações do produto.</DialogDescription>
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
