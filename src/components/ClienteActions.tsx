
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { useUserRole } from '@/hooks/useUserRole';

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
  const { canEdit } = useUserRole();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Verificar se há vínculos (encomendas, pagamentos)
      const { data: encomendas } = await supabase
        .from('encomendas')
        .select('id')
        .eq('cliente_id', cliente.id)
        .limit(1);

      const hasLinks = encomendas && encomendas.length > 0;

      if (hasLinks) {
        // Soft delete
        const { error } = await supabase
          .from('clientes')
          .update({ active: false })
          .eq('id', cliente.id);

        if (error) throw error;

        await logActivity({
          entity: 'cliente',
          entity_id: cliente.id,
          action: 'soft_delete',
          details: { nome: cliente.nome, reason: 'has_links' }
        });

        toast.success('Cliente desativado (possui vínculos)');
      } else {
        // Hard delete
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

        toast.success('Cliente removido');
      }

      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast.error('Erro ao deletar cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canEdit()) {
    return null;
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex-1" 
        onClick={() => onEdit(cliente)}
      >
        <Edit className="h-3 w-3 mr-1" />
        Editar
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{cliente.nome}"?
              {cliente.active ? ' Se houver vínculos, será desativado ao invés de removido.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
