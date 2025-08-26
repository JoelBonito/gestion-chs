
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Paperclip } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ProdutoForm from "./ProdutoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AttachmentManager } from "@/components/AttachmentManager";
import { useUserRole } from "@/hooks/useUserRole";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_venda: number;
  preco_custo: number;
  size_weight: number;
  ativo: boolean;
  fornecedor_id?: string;
  fornecedores?: {
    nome: string;
  };
}

interface ProdutoCardProps {
  produto: Produto;
}

export default function ProdutoCard({ produto }: ProdutoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useUserRole();
  
  const canEdit = hasRole('admin') || hasRole('ops');
  const canViewAttachments = hasRole('admin') || hasRole('ops') || hasRole('client');

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    toast({
      title: "Produto atualizado",
      description: "O produto foi atualizado com sucesso.",
    });
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produto.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const margem = produto.preco_venda - produto.preco_custo;
  const margemPercentual = produto.preco_custo > 0 ? (margem / produto.preco_custo) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {produto.nome}
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="font-medium">{produto.marca}</span>
              {produto.tipo && <span className="text-muted-foreground"> • {produto.tipo}</span>}
            </CardDescription>
          </div>
          <Badge 
            variant={produto.ativo ? "default" : "secondary"}
            className={produto.ativo ? "bg-success text-success-foreground" : ""}
          >
            {produto.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Preços e Margem */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Preço de Venda</p>
              <p className="text-lg font-semibold text-success">
                {formatCurrency(produto.preco_venda)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Preço de Custo</p>
              <p className="font-semibold">
                {formatCurrency(produto.preco_custo)}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Margem</span>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(margem)}
                </p>
                <p className={`text-sm ${margemPercentual >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {margemPercentual.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Peso/Tamanho e Fornecedor */}
          <div className="space-y-2 text-sm">
            {produto.size_weight > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peso/Tamanho:</span>
                <span className="font-medium">{produto.size_weight}kg</span>
              </div>
            )}
            {produto.fornecedores?.nome && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fornecedor:</span>
                <span className="font-medium">{produto.fornecedores.nome}</span>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            {canViewAttachments && (
              <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Anexar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <AttachmentManager 
                    entityType="produto" 
                    entityId={produto.id}
                  />
                </DialogContent>
              </Dialog>
            )}

            {canEdit && (
              <>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <ProdutoForm 
                      produto={produto}
                      onSuccess={handleEditSuccess}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
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
                      <AlertDialogAction onClick={handleDelete}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
