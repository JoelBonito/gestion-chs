
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Power } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { Produto } from "@/types/database";

interface ProdutoCardProps {
  produto: Produto;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export default function ProdutoCard({ produto, onUpdate, onDelete, onToggleActive }: ProdutoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { canEdit } = useUserRole();

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  return (
    <Card className="shadow-card border-border/40 hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display text-primary-dark">
            {produto.name}
          </CardTitle>
          <Badge 
            variant={produto.active ? "default" : "secondary"} 
            className={produto.active ? "bg-accent text-accent-foreground" : ""}
          >
            {produto.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Categoria</p>
            <p className="font-medium font-body">{produto.category}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preço</p>
            <p className="text-sm font-medium font-body">R$ {produto.price?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Custo</p> 
            <p className="text-sm font-medium font-body">R$ {produto.cost?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso</p>
            <p className="text-sm font-medium font-body">{produto.size_weight} kg</p>
          </div>
        </div>

        {canEdit() && (
          <div className="flex gap-2 pt-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit2 className="w-4 h-4 mr-2" />
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
              onClick={() => onToggleActive(produto.id, !produto.active)}
              className="flex-shrink-0"
            >
              <Power className="w-4 h-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o produto "{produto.name}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(produto.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
