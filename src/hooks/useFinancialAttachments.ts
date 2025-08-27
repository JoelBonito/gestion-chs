
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseStorage } from './useSupabaseStorage';
import { Attachment, AttachmentUploadData } from '@/types/attachment';

export const useFinancialAttachments = (entityType: string, entityId: string) => {
  const { toast } = useToast();
  const { deleteFile } = useSupabaseStorage();
  const queryClient = useQueryClient();
  
  const queryKey = ['financial-attachments', entityType, entityId];

  const {
    data: attachments = [],
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId) return [];
      
      console.log(`useFinancialAttachments - Buscando anexos para ${entityType}:${entityId}`);
      
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("useFinancialAttachments - Erro:", error);
        throw error;
      }
      
      console.log(`useFinancialAttachments - Encontrados ${data?.length || 0} anexos`);
      return data || [];
    },
    enabled: !!entityId
  });

  const createAttachmentMutation = useMutation({
    mutationFn: async (attachmentData: AttachmentUploadData) => {
      console.log(`useFinancialAttachments - Criando anexo no banco para ${entityType}:${entityId}`, attachmentData);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      const insertData = {
        entity_type: entityType,
        entity_id: entityId,
        file_name: attachmentData.file_name,
        file_type: attachmentData.file_type,
        storage_path: attachmentData.storage_path,
        storage_url: attachmentData.storage_url,
        file_size: attachmentData.file_size,
        uploaded_by: user.id
      };

      const { data, error } = await supabase
        .from('attachments')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("useFinancialAttachments - Erro ao inserir:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      console.log("useFinancialAttachments - Upload bem-sucedido, fazendo refetch");
      queryClient.invalidateQueries({ queryKey });
      refetch();
      toast({
        title: "Anexo adicionado",
        description: "Comprovante anexado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("useFinancialAttachments - Erro ao salvar anexo:", error);
      toast({
        title: "Erro ao salvar anexo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachment: Attachment) => {
      console.log("useFinancialAttachments - Deletando anexo:", attachment);

      await deleteFile(attachment.storage_path);

      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      return attachment;
    },
    onSuccess: () => {
      console.log("useFinancialAttachments - Delete bem-sucedido, fazendo refetch");
      queryClient.invalidateQueries({ queryKey });
      refetch();
      toast({
        title: "Anexo removido",
        description: "Comprovante removido com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("useFinancialAttachments - Erro ao remover anexo:", error);
      toast({
        title: "Erro ao remover anexo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    attachments,
    isLoading,
    error,
    refetch,
    createAttachment: createAttachmentMutation.mutate,
    deleteAttachment: deleteAttachmentMutation.mutate,
    isCreating: createAttachmentMutation.isPending,
    isDeleting: deleteAttachmentMutation.isPending
  };
};
