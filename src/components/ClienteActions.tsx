
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Archive, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { archiveCliente, reactivateCliente } from '@/lib/soft-delete-actions';

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  active: boolean;
}

interface ClienteActionsProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onRefresh: () => void;
}

export function ClienteActions({ cliente, onEdit, onRefresh }: ClienteActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      await archiveCliente(cliente.id);
      await logActivity({
        entity: 'cliente',
        entity_id: cliente.id,
        action: 'archive',
        details: { nome: cliente.nome }
      });
      onRefresh();
    } catch (error) {
      console.error('Erro ao arquivar cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    try {
      await reactivateCliente(cliente.id);
      await logActivity({
        entity: 'cliente',
        entity_id: cliente.id,
        action: 'reactivate',
        details: { nome: cliente.nome }
      });
      onRefresh();
    } catch (error) {
      console.error('Erro ao reativar cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Hard delete para casos específicos (apenas admin)
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id);

      if (error) throw error;

      await logActivity({
        entity: 'cliente',
        entity_id: cliente.id,
        action: 'hard_delete',
        details: { nome: cliente.nome }
      });

      toast.success('Cliente removido permanentemente');
      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast.error('Erro ao deletar cliente');
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
        onClick={() => onEdit(cliente)}
        disabled={isLoading}
      >
        <Edit className="h-3 w-3 mr-1" />
        Editar
      </Button>
      
      {cliente.active ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-600 hover:text-orange-700"
              disabled={isLoading}
            >
              <Archive className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar arquivamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja arquivar o cliente "{cliente.nome}"?
                O cliente será inativado e não aparecerá nas listagens, mas seus dados serão preservados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleArchive}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
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
              className="text-green-600 hover:text-green-700"
              disabled={isLoading}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar reativação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja reativar o cliente "{cliente.nome}"?
                O cliente voltará a aparecer nas listagens e poderá ser usado em novas encomendas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleReactivate}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
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
            className="text-red-600 hover:text-red-700"
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
              Tem certeza que deseja excluir permanentemente o cliente "{cliente.nome}"?
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
