
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
  const [refreshKey, setRefreshKey] = useState(0);
  const { canEdit } = useUserRole();

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  const handleAttachmentRefresh = () => {
    console.log("Executando refresh completo da ficha do produto");
    // Força um re-render completo incrementando a key
    setRefreshKey(prev => prev + 1);
    // Também chama o callback de update do componente pai
    onUpdate();
  };

  return (
    <Card className="shadow-card border-border/40 hover:shadow-card-hover transition-shadow" key={refreshKey}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display text-primary-dark">
            {produto.nome}
          </CardTitle>
          <Badge 
            variant={produto.ativo ? "default" : "secondary"} 
            className={produto.ativo ? "bg-accent text-accent-foreground" : ""}
          >
            {produto.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-medium font-body">{produto.tipo}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preço Venda</p>
            <p className="text-sm font-medium font-body">R$ {produto.preco_venda?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preço Custo</p> 
            <p className="text-sm font-medium font-body">R$ {produto.preco_custo?.toFixed(2)}</p>
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
                  onAttachmentRefresh={handleAttachmentRefresh}
                />
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleActive(produto.id, !produto.ativo)}
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
                    Tem certeza que deseja excluir o produto "{produto.nome}"? Esta ação não pode ser desfeita.
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
