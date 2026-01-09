
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreVertical, Eye, Edit, Trash2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  // Permissões passadas pelo componente pai
  canEditOrders?: boolean;
}

export function EncomendaActions({ encomenda, onView, onEdit, onDelete, onTransport, canEditOrders = false }: EncomendaActionsProps) {

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
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=open]:bg-muted data-[state=open]:ring-2 data-[state=open]:ring-primary/40">
          <span className="sr-only">Abrir menu</span>
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-popover border-border shadow-xl">
        <DropdownMenuItem onClick={onView} className="cursor-pointer group hover:!text-primary hover:!bg-primary/10 transition-colors">
          <Eye className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          Visualizar
        </DropdownMenuItem>
        {canEditOrders && (
          <>
            <DropdownMenuItem onClick={() => onEdit?.(encomenda)} className="cursor-pointer group hover:!text-blue-500 hover:!bg-blue-500/10 transition-colors">
              <Edit className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              Editar
            </DropdownMenuItem>
            {onTransport && (
              <DropdownMenuItem onClick={onTransport} className="cursor-pointer group hover:!text-purple-500 hover:!bg-purple-500/10 transition-colors">
                <Truck className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                Transporte
              </DropdownMenuItem>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer !text-muted-foreground group hover:!text-red-500 hover:!bg-red-500/10 focus:!bg-red-500/10 transition-colors"
                >
                  <Trash2 className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  Excluir
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a encomenda {encomenda.numero_encomenda}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-popover hover:bg-accent border-none text-foreground">Cancelar</AlertDialogCancel>
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
