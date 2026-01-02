import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreVertical, Archive } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Projeto } from "@/types/projeto";

interface ProjetoActionsProps {
  projeto: Projeto;
  onView: (projeto: Projeto) => void;
  onEdit: (projeto: Projeto) => void;
  onRefresh: () => void;
  isRestrictedUser?: boolean;
}

export function ProjetoActions({
  projeto,
  onView,
  onEdit,
  onRefresh,
  isRestrictedUser = false,
}: ProjetoActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isArchived = projeto.status === "arquivado";

  const handleArchive = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("projetos")
        .update({ status: isArchived ? "ativo" : "arquivado" })
        .eq("id", projeto.id);

      if (error) throw error;

      toast.success(
        isArchived ? "Projeto desarquivado com sucesso!" : "Projeto arquivado com sucesso!"
      );
      onRefresh();
    } catch (error) {
      console.error("Error archiving projeto:", error);
      toast.error("Erro ao atualizar status do projeto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      // Delete projeto from database
      const { error } = await supabase.from("projetos").delete().eq("id", projeto.id);

      if (error) throw error;

      toast.success("Projeto deletado com sucesso!");
      onRefresh();
    } catch (error) {
      console.error("Error deleting projeto:", error);
      toast.error("Erro ao deletar projeto");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="hover:bg-muted focus-visible:ring-primary/20 data-[state=open]:bg-muted data-[state=open]:ring-primary/40 h-8 w-8 rounded-md p-0 focus-visible:ring-2 data-[state=open]:ring-2"
          >
            <span className="sr-only">Abrir menu</span>
            <MoreVertical className="text-muted-foreground h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-popover w-[160px] border-[var(--border)] shadow-xl dark:bg-popover"
        >
          <DropdownMenuItem
            onClick={() => onView(projeto)}
            className="group hover:!text-primary hover:!bg-primary/10 cursor-pointer transition-colors"
          >
            <Eye className="text-muted-foreground group-hover:text-primary mr-3 h-4 w-4 transition-colors" />
            Visualizar
          </DropdownMenuItem>
          {!isRestrictedUser && (
            <>
              <DropdownMenuItem
                onClick={() => onEdit(projeto)}
                className="group cursor-pointer transition-colors hover:!bg-blue-500/10 hover:!text-blue-500"
              >
                <Edit className="text-muted-foreground mr-3 h-4 w-4 transition-colors group-hover:text-blue-500" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleArchive}
                className="group cursor-pointer transition-colors hover:!bg-amber-500/10 hover:!text-amber-500"
              >
                <Archive className="text-muted-foreground mr-3 h-4 w-4 transition-colors group-hover:text-amber-500" />
                {isArchived ? "Desarquivar" : "Arquivar"}
              </DropdownMenuItem>
            </>
          )}
          {!isRestrictedUser && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="!text-muted-foreground group cursor-pointer transition-colors hover:!bg-red-500/10 hover:!text-red-500 focus:!bg-red-500/10"
            >
              <Trash2 className="text-muted-foreground mr-3 h-4 w-4 transition-colors group-hover:text-red-500" />
              Deletar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o projeto "{projeto.nome}"? Esta ação não pode ser
              desfeita e todos os anexos relacionados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
