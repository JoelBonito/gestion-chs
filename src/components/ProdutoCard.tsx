
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Paperclip } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";
import { FinancialAttachmentButton } from "./FinancialAttachmentButton";
import { useState } from "react";
import { Produto } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

interface ProdutoCardProps {
  produto: Produto;
  onUpdate: () => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export default function ProdutoCard({ produto, onUpdate, onDelete }: ProdutoCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [produtoData, setProdutoData] = useState(produto);
  const { canEdit, hasRole } = useUserRole();

  const handleEditSuccess = async () => {
    console.log("=== PRODUTO EDITADO COM SUCESSO ===");
    console.log("ProdutoCard - Produto editado com sucesso, recarregando dados");
    
    try {
      // Recarregar dados do produto do banco de dados
      const { data: updatedProduct, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', produtoData.id)
        .single();

      if (error) {
        console.error("ProdutoCard - Erro ao recarregar produto após edição:", error);
        throw error;
      }

      if (updatedProduct) {
        console.log("ProdutoCard - Produto recarregado após edição:", updatedProduct);
        setProdutoData(updatedProduct);
      }
      
      setIsEditDialogOpen(false);
      console.log("ProdutoCard - Dados do produto atualizados e dialog fechado");
    } catch (error) {
      console.error("ProdutoCard - Erro ao atualizar dados do produto:", error);
      setIsEditDialogOpen(false);
    }
  };

  const handleAttachmentRefresh = async () => {
    console.log("=== ATTACHMENT REFRESH - Iniciando reload do produto ===");
    console.log("ProdutoCard - handleAttachmentRefresh chamado para produto:", produtoData.id);
    
    try {
      // Adicionar timeout para garantir que o anexo foi completamente gravado
      console.log("ProdutoCard - Aguardando 200ms para garantir gravação completa do anexo");
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Recarregar dados do produto do banco de dados
      console.log("ProdutoCard - Buscando dados atualizados do produto no banco");
      const { data: updatedProduct, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', produtoData.id)
        .single();

      if (error) {
        console.error("ProdutoCard - Erro ao recarregar produto:", error);
        throw error;
      }

      if (updatedProduct) {
        console.log("ProdutoCard - Produto recarregado com sucesso:", updatedProduct);
        setProdutoData(updatedProduct);
        console.log("ProdutoCard - Estado local do produto atualizado");
      }
      
      console.log("=== ATTACHMENT REFRESH COMPLETED - Produto recarregado ===");
    } catch (error) {
      console.error("ProdutoCard - Erro no refresh do produto:", error);
    }
  };

  return (
    <Card className="shadow-card border-border/40 hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display text-primary-dark">
            {produtoData.nome}
          </CardTitle>
          <Badge 
            variant={produtoData.ativo ? "default" : "secondary"} 
            className={produtoData.ativo ? "bg-accent text-accent-foreground" : ""}
          >
            {produtoData.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tipo</p>
            <p className="font-medium font-body">{produtoData.tipo}</p>
          </div>
          {!hasRole('factory') && (
            <div>
              <p className="text-muted-foreground">Preço Venda</p>
              <p className="text-sm font-medium font-body">R$ {produtoData.preco_venda?.toFixed(2)}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Preço Custo</p> 
            <p className="text-sm font-medium font-body">R$ {produtoData.preco_custo?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso</p>
            <p className="text-sm font-medium font-body">{produtoData.size_weight} g</p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {hasRole('factory') && (
            <FinancialAttachmentButton 
              entityId={produtoData.id}
              entityType="financeiro"
              title="Anexar Arquivos do Produto"
              onChanged={handleAttachmentRefresh}
            />
          )}
          
          {canEdit() && (
            <>
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
                    produto={produtoData} 
                    onSuccess={handleEditSuccess}
                    isEditing={true}
                  />
                </DialogContent>
              </Dialog>

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
                      Tem certeza que deseja excluir o produto "{produtoData.nome}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(produtoData.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
