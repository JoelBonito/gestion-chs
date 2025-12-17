import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Archive, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { archiveProduto, reactivateProduto } from '@/lib/soft-delete-actions';
import type { Produto } from '@/types/database';

interface ProdutoActionsProps {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onRefresh: () => void;
}

export function ProdutoActions({ produto, onEdit, onRefresh }: ProdutoActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await archiveProduto(produto.id);
      await logActivity({
        entity: 'produto',
        entity_id: produto.id,
        action: 'archive',
        details: { nome: produto.nome }
      });
      onRefresh();
    } catch (error) {
      console.error('Erro ao arquivar produto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      await reactivateProduto(produto.id);
      await logActivity({
        entity: 'produto',
        entity_id: produto.id,
        action: 'reactivate',
        details: { nome: produto.nome }
      });
      onRefresh();
    } catch (error) {
      console.error('Erro ao reativar produto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Hard delete para casos específicos (apenas admin)
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produto.id);

      if (error) throw error;

      await logActivity({
        entity: 'produto',
        entity_id: produto.id,
        action: 'hard_delete',
        details: { nome: produto.nome }
      });

      toast.success('Produto removido permanentemente');
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 pt-2">
      <Button
        variant="ghost"
        size="sm"
        className="flex-1"
        onClick={() => onEdit(produto)}
        disabled={isLoading}
      >
        <Edit className="h-3 w-3 mr-1" />
        Editar
      </Button>

      {produto.ativo ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-warning hover:text-warning/80"
              disabled={isLoading}
            >
              <Archive className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar arquivamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja arquivar o produto "{produto.nome}"?
                O produto será inativado e não aparecerá nas listagens, mas seus dados serão preservados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
                disabled={isLoading}
                className="bg-warning hover:bg-warning/80"
              >
                {isLoading ? 'Arquivando...' : 'Arquivar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-success hover:text-success/80"
              disabled={isLoading}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar reativação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja reativar o produto "{produto.nome}"?
                O produto voltará a aparecer nas listagens e poderá ser usado em novas encomendas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReactivate}
                disabled={isLoading}
                className="bg-success hover:bg-success/80"
              >
                {isLoading ? 'Reativando...' : 'Reativar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
            disabled={isLoading}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão permanente</AlertDialogTitle>
            <AlertDialogDescription>
              ⚠️ ATENÇÃO: Esta ação é irreversível!
              Tem certeza que deseja excluir permanentemente o produto "{produto.nome}"?
              Todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Excluindo...' : 'Excluir Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}