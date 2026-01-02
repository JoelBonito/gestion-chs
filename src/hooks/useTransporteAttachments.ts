import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseStorage } from "./useSupabaseStorage";

interface TransporteAttachment {
  id: string;
  transporte_id: string;
  url: string;
  name: string;
  file_type: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export const useTransporteAttachments = (transporteId: string) => {
  const { toast } = useToast();
  const { deleteFile } = useSupabaseStorage();
  const queryClient = useQueryClient();

  const queryKey = ["transporte-attachments", transporteId];

  const {
    data: attachments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!transporteId) {
        console.log("useTransporteAttachments - Sem transporteId, não buscando anexos");
        return [];
      }

      console.log(`useTransporteAttachments - Buscando anexos para transporteId: ${transporteId}`);

      const { data, error } = await supabase
        .from("transporte_attachments")
        .select("*")
        .eq("transporte_id", transporteId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("useTransporteAttachments - Erro ao buscar anexos:", error);
        throw error;
      }

      console.log(`useTransporteAttachments - Anexos encontrados (${data?.length || 0}):`, data);
      return data || [];
    },
    enabled: !!transporteId,
    staleTime: 0,
    gcTime: 0,
  });

  const createAttachment = async (attachmentData: {
    name: string;
    file_type: string;
    url: string;
    file_size: number;
  }) => {
    console.log(
      `useTransporteAttachments - Criando anexo para transporteId: ${transporteId}`,
      attachmentData
    );

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("useTransporteAttachments - Erro ao obter usuário:", userError);
        throw new Error("Erro ao obter usuário atual");
      }

      if (!user) {
        console.error("useTransporteAttachments - Usuário não autenticado");
        throw new Error("Usuário não autenticado");
      }

      const insertData = {
        transporte_id: transporteId,
        name: attachmentData.name,
        file_type: attachmentData.file_type,
        url: attachmentData.url,
        file_size: attachmentData.file_size,
        uploaded_by: user.id,
      };

      console.log("useTransporteAttachments - Dados para inserção:", insertData);

      const { data, error } = await supabase
        .from("transporte_attachments")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("useTransporteAttachments - Erro ao inserir:", error);
        throw error;
      }

      console.log("useTransporteAttachments - Anexo inserido com sucesso:", data);

      await queryClient.invalidateQueries({ queryKey });
      await refetch();

      toast({
        title: "Anexo adicionado",
        description: "Arquivo anexado com sucesso.",
      });

      return data;
    } catch (error: any) {
      console.error("useTransporteAttachments - Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar anexo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAttachment = async (attachment: TransporteAttachment) => {
    try {
      console.log("useTransporteAttachments - Deletando anexo:", attachment);

      // Extract storage path from URL for deletion
      const storagePath = attachment.url.split("/").slice(-2).join("/");
      await deleteFile(storagePath);

      const { error } = await supabase
        .from("transporte_attachments")
        .delete()
        .eq("id", attachment.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey });
      await refetch();

      toast({
        title: "Anexo removido",
        description: "Arquivo removido com sucesso.",
      });
    } catch (error: any) {
      console.error("useTransporteAttachments - Erro ao remover:", error);
      toast({
        title: "Erro ao remover anexo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    attachments,
    isLoading,
    createAttachment,
    deleteAttachment,
    refetch,
  };
};
