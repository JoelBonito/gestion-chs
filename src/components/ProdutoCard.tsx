
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Paperclip, Euro, Package, Scale } from "lucide-react";
import { AttachmentManager } from "@/components/AttachmentManager";
import { ProdutoForm } from "@/components/ProdutoForm";
import { useUserRole } from "@/hooks/useUserRole";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_custo: number;
  preco_venda: number;
  size_weight: number;
  fornecedor_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  fornecedor?: {
    nome: string;
  };
}

interface ProdutoCardProps {
  produto: Produto;
  onUpdate?: () => void;
}

export function ProdutoCard({ produto, onUpdate }: ProdutoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const { hasRole } = useUserRole();
  
  const canEdit = hasRole('admin') || hasRole('ops');
  const canViewAttachments = hasRole('admin') || hasRole('ops') || hasRole('viewer');

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate?.();
  };

  return (
    <Card className="shadow-card border-primary/10 bg-gradient-card hover:shadow-hover transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="font-display text-primary-dark text-lg font-medium">
              {produto.nome}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {produto.marca}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {produto.tipo}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {canViewAttachments && (
              <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-primary-dark">
                      Anexos - {produto.nome}
                    </DialogTitle>
                  </DialogHeader>
                  <AttachmentManager 
                    entityType="produto" 
                    entityId={produto.id}
                  />
                </DialogContent>
              </Dialog>
            )}
            
            {canEdit && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md shadow-elegant">
                  <DialogHeader>
                    <DialogTitle className="font-display text-primary-dark">
                      Editar Produto
                    </DialogTitle>
                  </DialogHeader>
                  <ProdutoForm 
                    initialData={produto}
                    isEditing={true}
                    onSuccess={handleEditSuccess}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Euro className="h-4 w-4" />
              <span>Custo: €{produto.preco_custo.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Euro className="h-4 w-4" />
              <span>Venda: €{produto.preco_venda.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              <span>{produto.size_weight}g/ml</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{produto.fornecedor?.nome || 'Fornecedor não encontrado'}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-primary/10">
          <p className="text-xs text-muted-foreground">
            Criado em: {new Date(produto.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
