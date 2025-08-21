
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Edit, ExternalLink, FileDown, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import { useUserRole } from '@/hooks/useUserRole';

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
  const { canEdit } = useUserRole();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCatalogClick = () => {
    if (fornecedor.catalog_url) {
      window.open(fornecedor.catalog_url, '_blank');
    } else if (fornecedor.catalog_file) {
      // Aqui você pode implementar o download do arquivo
      toast.info('Funcionalidade de download em desenvolvimento');
    }
  };

  const hasCatalog = fornecedor.catalog_url || fornecedor.catalog_file;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Verificar se há vínculos (produtos, encomendas)
      const { data: produtos } = await supabase
        .from('produtos')
        .select('id')
        .eq('fornecedor_id', fornecedor.id)
        .limit(1);

      const { data: encomendas } = await supabase
        .from('encomendas')
        .select('id')
        .eq('fornecedor_id', fornecedor.id)
        .limit(1);

      const hasLinks = (produtos && produtos.length > 0) || (encomendas && encomendas.length > 0);

      if (hasLinks) {
        // Soft delete
        const { error } = await supabase
          .from('fornecedores')
          .update({ active: false })
          .eq('id', fornecedor.id);

        if (error) throw error;

        await logActivity({
          entity: 'fornecedor',
          entity_id: fornecedor.id,
          action: 'soft_delete',
          details: { nome: fornecedor.nome, reason: 'has_links' }
        });

        toast.success('Fornecedor desativado (possui vínculos)');
      } else {
        // Hard delete
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

        toast.success('Fornecedor removido');
      }

      onRefresh();
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      toast.error('Erro ao deletar fornecedor');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 pt-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleCatalogClick}
              disabled={!hasCatalog}
            >
              {fornecedor.catalog_url ? (
                <ExternalLink className="h-3 w-3 mr-1" />
              ) : fornecedor.catalog_file ? (
                <FileDown className="h-3 w-3 mr-1" />
              ) : (
                <Package className="h-3 w-3 mr-1" />
              )}
              Ver Catálogo
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasCatalog 
              ? (fornecedor.catalog_url ? 'Abrir catálogo online' : 'Baixar arquivo do catálogo')
              : 'Fornecedor sem catálogo'
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {canEdit() && (
        <>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1" 
            onClick={() => onEdit(fornecedor)}
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
                  Tem certeza que deseja excluir o fornecedor "{fornecedor.nome}"?
                  {fornecedor.active ? ' Se houver vínculos, será desativado ao invés de removido.' : ''}
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
        </>
      )}
    </div>
  );
}
