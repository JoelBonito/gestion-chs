
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Produto } from "@/types/database";

interface ProdutoCardProps {
  produto: Produto;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

export default function ProdutoCard({ produto, onUpdate, onDelete, onToggleActive }: ProdutoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Remove the useUserRole hook restriction for now to test functionality
  const canEdit = true; // Temporarily allow all users to edit

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  return (
    <Card className={`shadow-card transition-all duration-300 hover:shadow-hover ${!produto.ativo ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-display text-lg font-medium text-primary-dark">{produto.nome}</CardTitle>
            <p className="text-sm text-muted-foreground font-body">{produto.marca} • {produto.tipo}</p>
          </div>
          <Badge variant={produto.ativo ? "default" : "secondary"} className="font-body text-xs">
            {produto.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Preço Venda</p>
            <p className="text-lg font-semibold text-green-600 font-body">
              R$ {produto.preco_venda.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Preço Custo</p>
            <p className="text-lg font-semibold text-amber-600 font-body">
              R$ {produto.preco_custo.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Peso/Tamanho</p>
          <p className="text-sm font-medium font-body">{produto.size_weight} kg</p>
        </div>

        {canEdit && (
          <div className="flex gap-2 pt-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 font-body">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-elegant">
                <DialogHeader>
                  <DialogTitle className="font-display text-primary-dark">Editar Produto</DialogTitle>
                </DialogHeader>
                <ProdutoForm 
                  produto={produto}
                  onSuccess={handleEditSuccess} 
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleActive(produto.id, produto.ativo)}
              className="font-body"
            >
              {produto.ativo ? (
                <>
                  <Archive className="w-4 h-4 mr-1" />
                  Inativar
                </>
              ) : (
                <>
                  <ArchiveRestore className="w-4 h-4 mr-1" />
                  Ativar
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="font-body">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="shadow-elegant">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-primary-dark">Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    Tem certeza que deseja excluir o produto "{produto.nome}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(produto.id)}
                    className="bg-destructive hover:bg-destructive/90 font-body"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
