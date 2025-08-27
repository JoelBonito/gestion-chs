
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { archiveFornecedor, reactivateFornecedor } from '@/lib/soft-delete-actions';

interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  contato?: string;
  active: boolean;
  catalog_url?: string;
  catalog_file?: string;
}

interface FornecedorActionsProps {
  fornecedor: Fornecedor;
  onEdit: (fornecedor: Fornecedor) => void;
  onRefresh: () => void;
}

export function FornecedorActions({ fornecedor, onEdit, onRefresh }: FornecedorActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Hard delete para casos específicos (apenas admin)
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
    <div className="flex gap-2 pt-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex-1" 
        onClick={() => onEdit(fornecedor)}
        disabled={isLoading}
      >
        <Edit className="h-3 w-3 mr-1" />
        Editar
      </Button>
      
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
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{fornecedor.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
