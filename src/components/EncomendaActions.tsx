
import { useState } from "react";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EncomendaActionsProps {
  encomenda: {
    id: string;
    numero_encomenda: string;
  };
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EncomendaActions({ encomenda, onView, onEdit, onDelete }: EncomendaActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Primeiro deletar os itens da encomenda
      const { error: itensError } = await supabase
        .from("itens_encomenda")
        .delete()
        .eq("encomenda_id", encomenda.id);

      if (itensError) throw itensError;

      // Depois deletar os pagamentos da encomenda
      const { error: pagamentosError } = await supabase
        .from("pagamentos")
        .delete()
        .eq("encomenda_id", encomenda.id);

      if (pagamentosError) throw pagamentosError;

      // Por fim deletar a encomenda
      const { error: encomendaError } = await supabase
        .from("encomendas")
        .delete()
        .eq("id", encomenda.id);

      if (encomendaError) throw encomendaError;

      toast.success("Encomenda deletada com sucesso!");
      onDelete();
    } catch (error) {
      console.error("Erro ao deletar encomenda:", error);
      toast.error("Erro ao deletar encomenda");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a encomenda #{encomenda.numero_encomenda}? 
              Esta ação não pode ser desfeita e também deletará todos os itens e pagamentos relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
