import { useState } from "react";
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
import { Trash2, Edit, Eye, Archive, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/utils/activityLogger";
import { archiveCliente, reactivateCliente } from "@/lib/soft-delete-actions";
import { cn } from "@/lib/utils";

import { Cliente } from "@/types/database";

interface ClienteActionsProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onView: (cliente: Cliente) => void;
  onRefresh: () => void;
}

export function ClienteActions({ cliente, onEdit, onView, onRefresh }: ClienteActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(cliente);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(cliente);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (cliente.active) {
        await archiveCliente(cliente.id);
        toast.success("Cliente arquivado com sucesso");
      } else {
        await reactivateCliente(cliente.id);
        toast.success("Cliente reativado com sucesso");
      }
      onRefresh();
    } catch (error) {
      console.error("Erro ao alternar status do cliente:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", cliente.id);

      if (error) throw error;

      await logActivity({
        entity: "cliente",
        entity_id: cliente.id,
        action: "hard_delete",
        details: { nome: cliente.nome },
      });

      toast.success("Cliente removido permanentemente");
      onRefresh();
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      toast.error("Erro ao deletar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-border/30 flex items-center gap-2 border-t pt-2">
      {/* Visualizar */}
      <button
        onClick={handleView}
        className="text-muted-foreground hover:bg-nav-dashboard/10 hover:text-nav-dashboard rounded-full bg-transparent p-2 transition-all hover:scale-110"
        title="Visualizar"
        aria-label="Visualizar cliente"
      >
        <Eye className="h-4 w-4" />
      </button>

      {/* Editar */}
      <button
        onClick={handleEdit}
        className="text-muted-foreground hover:bg-nav-finance/10 hover:text-nav-finance rounded-full bg-transparent p-2 transition-all hover:scale-110"
        title="Editar"
        aria-label="Editar cliente"
        disabled={isLoading}
      >
        <Edit className="h-4 w-4" />
      </button>

      {/* Arquivar / Reativar */}
      <button
        onClick={handleArchive}
        className={cn(
          "rounded-full p-2 transition-all hover:scale-110",
          cliente.active
            ? "text-muted-foreground bg-transparent hover:bg-amber-500/10 hover:text-amber-500"
            : "text-muted-foreground bg-transparent hover:bg-emerald-500/10 hover:text-emerald-500"
        )}
        title={cliente.active ? "Arquivar" : "Reativar"}
        aria-label={cliente.active ? "Arquivar cliente" : "Reativar cliente"}
        disabled={isLoading}
      >
        {cliente.active ? <Archive className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
      </button>

      <div className="flex-1" />

      {/* Deletar permanentemente */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="text-muted-foreground hover:bg-error/10 hover:text-error rounded-full bg-transparent p-2 transition-all hover:scale-110"
            title="Excluir Permanentemente"
            aria-label="Excluir cliente permanentemente"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o cliente "{cliente.nome}"? Esta ação
              não pode ser desfeita e removerá todos os dados arquivados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
