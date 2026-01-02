import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit, Eye, Archive, RefreshCcw, MoreHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/utils/activityLogger";
import { cn } from "@/lib/utils";
import { Produto } from "@/types/database";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ProdutoActionsProps {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onView: (produto: Produto) => void;
  onRefresh: () => void;
  className?: string;
}

export function ProdutoActions({
  produto,
  onEdit,
  onView,
  onRefresh,
  className,
}: ProdutoActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { isCollaborator } = useIsCollaborator();
  const { user } = useAuth();
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";
  const isRestricted = isCollaborator || isHam;

  const handleView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onView(produto);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit(produto);
  };

  const handleArchive = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsLoading(true);
    try {
      const newStatus = !produto.ativo;
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: newStatus })
        .eq("id", produto.id);

      if (error) throw error;

      await logActivity({
        entity: "produto",
        entity_id: produto.id,
        action: newStatus ? "activate" : "deactivate",
        details: { nome: produto.nome },
      });

      toast.success(`Produto ${newStatus ? "reativado" : "arquivado"} com sucesso`);
      onRefresh();
    } catch (error) {
      console.error("Erro ao alternar status do produto:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", produto.id);

      if (error) throw error;

      await logActivity({
        entity: "produto",
        entity_id: produto.id,
        action: "hard_delete",
        details: { nome: produto.nome },
      });

      toast.success("Produto removido permanentemente");
      setShowDeleteAlert(false);
      onRefresh();
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      toast.error("Erro ao deletar produto");
    } finally {
      setIsLoading(false);
    }
  };

  if (isHam) {
    return (
      <div className={cn("flex items-center justify-center py-1", className)}>
        <Button
          variant="ghost"
          className="group hover:bg-primary/10 hover:text-primary h-8 w-8 p-0 transition-colors"
          onClick={handleView}
          title="Visualizar"
          aria-label="Visualizar produto"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" className="group hover:bg-muted/10 h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-border/50 min-w-[140px] bg-secondary p-1.5 dark:bg-popover"
        >
          <DropdownMenuItem
            onClick={handleView}
            className="hover:text-primary hover:bg-primary/10 focus:text-primary focus:bg-primary/10 cursor-pointer py-2 transition-colors"
          >
            <Eye className="mr-2.5 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>

          {!isRestricted && (
            <DropdownMenuItem
              onClick={handleEdit}
              className="cursor-pointer py-2 transition-colors hover:bg-blue-400/10 hover:text-blue-400 focus:bg-blue-400/10 focus:text-blue-400"
            >
              <Edit className="mr-2.5 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {!isRestricted && (
            <DropdownMenuItem
              onClick={handleArchive}
              className="cursor-pointer py-2 transition-colors hover:bg-orange-500/10 hover:text-orange-500 focus:bg-orange-500/10 focus:text-orange-500"
            >
              {produto.ativo ? (
                <>
                  <Archive className="mr-2.5 h-4 w-4" /> Arquivar
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2.5 h-4 w-4" /> Reativar
                </>
              )}
            </DropdownMenuItem>
          )}

          {!isRestricted && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteAlert(true);
              }}
              className="text-destructive cursor-pointer py-2 transition-colors hover:bg-red-500/10 hover:text-red-500 focus:bg-red-500/10 focus:text-red-500"
            >
              <Trash2 className="mr-2.5 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent
          onClick={(e) => e.stopPropagation()}
          className="bg-card border-none shadow-2xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o produto "{produto.nome}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(e) => e.stopPropagation()}
              className="bg-popover border-border/20"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
