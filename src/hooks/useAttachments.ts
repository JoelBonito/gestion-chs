
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseStorage } from './useSupabaseStorage';

interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export const useAttachments = (entityType: string, entityId: string) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { deleteFile } = useSupabaseStorage();

  const fetchAttachments = async () => {
    if (!entityId) {
      console.log("useAttachments - Sem entityId, não buscando anexos");
      setAttachments([]);
      return;
    }
    
    console.log(`useAttachments - Buscando anexos para entityType: ${entityType}, entityId: ${entityId}`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("useAttachments - Erro ao buscar anexos:", error);
        throw error;
      }
      
      console.log(`useAttachments - Anexos encontrados (${data?.length || 0}):`, data);
      setAttachments(data || []);
    } catch (error: any) {
      console.error("useAttachments - Erro ao carregar anexos:", error);
      toast({
        title: "Erro ao carregar anexos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAttachment = async (attachmentData: {
    file_name: string;
    file_type: string;
    storage_path: string;
    storage_url: string;
    file_size: number;
  }) => {
    console.log(`useAttachments - Criando anexo no banco para entityType: ${entityType}, entityId: ${entityId}`, attachmentData);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("useAttachments - Erro ao obter usuário:", userError);
        throw new Error("Erro ao obter usuário atual");
      }

      if (!user) {
        console.error("useAttachments - Usuário não autenticado");
        throw new Error("Usuário não autenticado");
      }

      console.log("useAttachments - Usuário autenticado:", user.id);

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

      console.log("useAttachments - Dados para inserção no banco:", insertData);

      const { data, error } = await supabase
        .from('attachments')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("useAttachments - Erro do Supabase ao inserir anexo:", error);
        console.error("useAttachments - Detalhes do erro:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log("useAttachments - Anexo inserido com sucesso no banco:", data);
      
      // Atualiza a lista local imediatamente - adiciona no início do array
      setAttachments(prev => {
        console.log("useAttachments - Atualizando lista local. Lista anterior:", prev.length, "itens");
        const newList = [data, ...prev];
        console.log("useAttachments - Nova lista terá:", newList.length, "itens");
        return newList;
      });
      
      toast({
        title: "Anexo adicionado",
        description: "Arquivo anexado com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error("useAttachments - Erro ao salvar anexo:", error);
      toast({
        title: "Erro ao salvar anexo",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteAttachment = async (attachment: Attachment) => {
    try {
      console.log("useAttachments - Deletando anexo:", attachment);

      // First delete the file from storage
      await deleteFile(attachment.storage_path);

      // Then delete the record from database
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      // Remove from local state immediately
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));

      toast({
        title: "Anexo removido",
        description: "Arquivo removido com sucesso.",
      });
    } catch (error: any) {
      console.error("useAttachments - Erro ao remover anexo:", error);
      toast({
        title: "Erro ao remover anexo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.log(`useAttachments - useEffect executado para entityType: ${entityType}, entityId: ${entityId}`);
    fetchAttachments();
  }, [entityType, entityId]);

  return {
    attachments,
    isLoading,
    createAttachment,
    deleteAttachment,
    refetch: fetchAttachments
  };
};
