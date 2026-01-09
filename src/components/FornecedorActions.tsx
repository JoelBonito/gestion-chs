
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Eye, Archive, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { archiveFornecedor, reactivateFornecedor } from '@/lib/soft-delete-actions';
import { cn } from '@/lib/utils';



import { Fornecedor } from "@/types/database";

interface FornecedorActionsProps {
  fornecedor: Fornecedor;
  onEdit: (fornecedor: Fornecedor) => void;
  onView: (fornecedor: Fornecedor) => void;
  onRefresh: () => void;
}

export function FornecedorActions({ fornecedor, onEdit, onView, onRefresh }: FornecedorActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(fornecedor);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(fornecedor);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (fornecedor.active) {
        await archiveFornecedor(fornecedor.id);
        toast.success('Fornecedor arquivado com sucesso');
      } else {
        await reactivateFornecedor(fornecedor.id);
        toast.success('Fornecedor reativado com sucesso');
      }
      onRefresh();
    } catch (error) {
      console.error('Erro ao alternar status do fornecedor:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', fornecedor.id);

      if (error) throw error;

      await logActivity({
        entity: 'fornecedor',
        entity_id: fornecedor.id,
        action: 'hard_delete',
        details: { nome: fornecedor.nome }
      });

      toast.success('Fornecedor removido permanentemente');
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      toast.error('Erro ao deletar fornecedor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
      {/* Visualizar */}
      <button
        onClick={handleView}
        className="p-2 rounded-full bg-transparent text-muted-foreground hover:bg-nav-dashboard/10 hover:text-nav-dashboard hover:scale-110 transition-all"
        title="Visualizar"
      >
        <Eye className="h-4 w-4" />
      </button>

      {/* Editar */}
      <button
        onClick={handleEdit}
        className="p-2 rounded-full bg-transparent text-muted-foreground hover:bg-nav-finance/10 hover:text-nav-finance hover:scale-110 transition-all"
        title="Editar"
        disabled={isLoading}
      >
        <Edit className="h-4 w-4" />
      </button>

      {/* Arquivar / Reativar */}
      <button
        onClick={handleArchive}
        className={cn(
          "p-2 rounded-full hover:scale-110 transition-all",
          fornecedor.active
            ? "bg-transparent text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
            : "bg-transparent text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
        )}
        title={fornecedor.active ? "Arquivar" : "Reativar"}
        disabled={isLoading}
      >
        {fornecedor.active ? <Archive className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
      </button>

      <div className="flex-1" />

      {/* Deletar permanentemente */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="p-2 rounded-full bg-transparent text-muted-foreground hover:bg-error/10 hover:text-error hover:scale-110 transition-all"
            title="Excluir Permanentemente"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o fornecedor "{fornecedor.nome}"?
              Esta ação não pode ser desfeita e removerá todos os dados arquivados.
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
