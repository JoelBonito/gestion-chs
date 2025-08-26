
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_type: string;
  gdrive_file_id: string;
  gdrive_view_link: string;
  gdrive_download_link: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export const useAttachments = (entityType: string, entityId: string) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAttachments = async () => {
    if (!entityId) {
      console.log("Sem entityId, não buscando anexos");
      return;
    }
    
    console.log("Buscando anexos para:", { entityType, entityId });
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar anexos:", error);
        throw error;
      }
      
      console.log("Anexos encontrados:", data);
      setAttachments(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar anexos:", error);
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
    gdrive_file_id: string;
    gdrive_view_link: string;
    gdrive_download_link: string;
    file_size: number;
  }) => {
    console.log("Criando anexo no banco de dados:", { entityType, entityId, attachmentData });
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Erro ao obter usuário:", userError);
        throw new Error("Erro ao obter usuário atual");
      }

      if (!user) {
        console.error("Usuário não autenticado");
        throw new Error("Usuário não autenticado");
      }

      console.log("Usuário autenticado:", user.id);

      const insertData = {
        entity_type: entityType,
        entity_id: entityId,
        file_name: attachmentData.file_name,
        file_type: attachmentData.file_type,
        gdrive_file_id: attachmentData.gdrive_file_id,
        gdrive_view_link: attachmentData.gdrive_view_link,
        gdrive_download_link: attachmentData.gdrive_download_link,
        file_size: attachmentData.file_size,
        uploaded_by: user.id
      };

      console.log("Dados para inserção:", insertData);

      const { data, error } = await supabase
        .from('attachments')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Erro do Supabase ao inserir anexo:", error);
        throw error;
      }
      
      console.log("Anexo inserido com sucesso:", data);

      await fetchAttachments();
      toast({
        title: "Anexo adicionado",
        description: "Arquivo anexado com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error("Erro ao salvar anexo:", error);
      toast({
        title: "Erro ao salvar anexo",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      await fetchAttachments();
      toast({
        title: "Anexo removido",
        description: "Arquivo removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover anexo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    console.log("useAttachments useEffect executado:", { entityType, entityId });
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
