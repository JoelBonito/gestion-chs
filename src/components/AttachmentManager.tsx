import React, { useMemo } from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AttachmentManagerProps {
 entityType: string;
 entityId: string;
 title?: string;
 onChanged?: () => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
 entityType,
 entityId,
 title = "Anexos",
 onChanged
}) => {
 const { toast } = useToast();
 const queryClient = useQueryClient();

 // Função para criar anexo diretamente no banco
 const createAttachment = async (fileData: {
   file_name: string;
   file_type: string;
   storage_path: string;
   storage_url: string;
   file_size: number;
 }) => {
   try {
     console.log("AttachmentManager - Iniciando criação do anexo:", {
       entityType,
       entityId,
       fileData
     });

     // Obter usuário atual
     const { data: userData, error: userError } = await supabase.auth.getUser();
     if (userError) {
       console.error("Erro ao obter usuário:", userError);
       throw userError;
     }

     // Inserir anexo na tabela
     const { data, error } = await supabase
       .from('attachments')
       .insert({
         entity_type: entityType,
         entity_id: entityId,
         file_name: fileData.file_name,
         file_type: fileData.file_type,
         storage_path: fileData.storage_path,
         storage_url: fileData.storage_url,
         file_size: fileData.file_size,
         created_by: userData.user?.id
       })
       .select()
       .single();

     if (error) {
       console.error("Erro SQL ao inserir anexo:", error);
       throw new Error(`Falha ao salvar anexo: ${error.message}`);
     }

     console.log("Anexo salvo com sucesso no banco:", data);
     return data;

   } catch (error: any) {
     console.error("Erro completo na criação do anexo:", error);
     throw error;
   }
 };

 // Handler para upload bem-sucedido
 const handleUploadSuccess = useMemo(() => async (fileData: {
   file_name: string;
   file_type: string;
   storage_path: string;
   storage_url: string;
   file_size: number;
 }) => {
   
   console.log("AttachmentManager - Processando upload:", fileData);
   
   try {
     // Criar anexo no banco
     const attachment = await createAttachment(fileData);
     
     // Invalidar queries para refresh automático
     const queryKeys = [
       ['attachments'],
       ['attachments', entityType],
       ['attachments', entityType, entityId],
       ['financial-attachments'],
       [`${entityType}-attachments`]
     ];

     for (const key of queryKeys) {
       await queryClient.invalidateQueries({ queryKey: key });
     }

     // Pequeno delay para garantir que as queries foram invalidadas
     await new Promise(resolve => setTimeout(resolve, 200));

     // Toast de sucesso
     toast({
       title: "Anexo adicionado com sucesso",
       description: `Arquivo: ${fileData.file_name}`,
     });

     // Callback para componente pai
     if (onChanged) {
       console.log("AttachmentManager - Executando callback onChanged");
       onChanged();
     }

     console.log("AttachmentManager - Upload processado completamente");

   } catch (error: any) {
     console.error("AttachmentManager - Erro no processamento:", error);
     
     toast({
       title: "Erro ao salvar anexo",
       description: error.message || "Falha desconhecida",
       variant: "destructive",
     });
     
     // Re-throw para que o componente de upload possa lidar
     throw error;
   }
 }, [entityType, entityId, onChanged, queryClient, toast]);

 // Handler para delete bem-sucedido
 const handleDeleteSuccess = async () => {
   console.log("AttachmentManager - Processando delete");
   
   try {
     // Invalidar todas as queries relacionadas
     await queryClient.invalidateQueries({ 
       queryKey: ['attachments'] 
     });
     
     await queryClient.invalidateQueries({ 
       queryKey: ['financial-attachments'] 
     });

     // Callback para componente pai
     if (onChanged) {
       onChanged();
     }

     toast({
       title: "Anexo removido com sucesso",
     });

   } catch (error) {
     console.error("Erro no pós-processamento do delete:", error);
   }
 };

 // Validação de props
 if (!entityId || !entityType) {
   console.warn("AttachmentManager - Props inválidas:", { entityType, entityId });
   return (
     <div className="text-sm text-gray-500 p-4 border border-dashed rounded-lg">
       Erro: ID da entidade ou tipo não fornecido
     </div>
   );
 }

 return (
   <div className="space-y-6">
     <div className="border rounded-lg p-4">
       <h4 className="text-sm font-medium mb-3">{title}</h4>
       
       <AttachmentUpload 
         entityType={entityType}
         entityId={entityId}
         onUploadSuccess={handleUploadSuccess}
       />
       
       <div className="mt-4">
         <AttachmentList 
           entityType={entityType} 
           entityId={entityId}
           onChanged={handleDeleteSuccess}
         />
       </div>
     </div>
   </div>
 );
};
