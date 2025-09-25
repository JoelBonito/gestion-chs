
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";
import { isReadonlyOrders } from "@/lib/permissions";

type StatusEncomenda = "NOVO PEDIDO" | "MATÉRIA PRIMA" | "PRODUÇÃO" | "EMBALAGENS" | "TRANSPORTE" | "ENTREGUE";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: StatusEncomenda;
  valor_total: number;
  valor_pago: number;
  data_criacao: string;
  cliente_id: string;
  fornecedor_id: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

interface EncomendaActionsProps {
  encomenda: Encomenda;
  onView?: () => void;
  onEdit?: (data: any) => void;
  onDelete?: () => void;
  onTransport?: () => void;
}

export function EncomendaActions({ encomenda, onView, onEdit, onDelete }: EncomendaActionsProps) {
  const { hasRole, canEdit } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { user } = useAuth();
  const readOnlyOrders = isReadonlyOrders(user);
  const handleDelete = async () => {
    try {
      const { data, error } = await supabase.rpc('delete_encomenda_safely', {
        p_encomenda_id: encomenda.id
      });

      if (error) throw error;
      
      toast.success("Encomenda excluída com sucesso!");
      onDelete();
    } catch (error: any) {
      console.error("Erro ao excluir encomenda:", error);
      toast.error(error.message || "Erro ao excluir encomenda");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        {canEdit() && !isCollaborator && !readOnlyOrders && (
          <>
            <DropdownMenuItem onClick={() => onEdit?.(encomenda)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a encomenda {encomenda.numero_encomenda}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
