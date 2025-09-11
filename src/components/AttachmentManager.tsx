import React, { useMemo } from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/useAttachments';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AttachmentManagerProps {
 entityType: string;
 entityId: string;
 title?: string;
 onChanged?: () => void;
 compact?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
 entityType,
 entityId,
 title = "Anexos",
 onChanged,
 compact = false
}) => {
 const { createAttachment, refetch } = useAttachments(entityType, entityId);
 const queryClient = useQueryClient();
 const { toast } = useToast();

 const handleUploadSuccess = useMemo(() => async (fileData: {
   file_name: string;
   file_type: string;
   storage_path: string;
   storage_url: string;
   file_size: number;
 }) => {
   console.log("AttachmentManager - Upload bem-sucedido:", fileData);
   console.log(`AttachmentManager - Criando anexo para ${entityType}:${entityId}`);
   
   try {
     const result = await createAttachment(fileData);
     console.log("AttachmentManager - Anexo criado:", result);
     
     // Invalidar TODAS as queries relacionadas com anexos
     await queryClient.invalidateQueries({ 
       queryKey: ['attachments'] 
     });
     
     // Invalidar queries financeiras
     await queryClient.invalidateQueries({ 
       queryKey: ['financial-attachments'] 
     });
     
      // Invalidar queries específicas para produtos
      if (entityType === 'produto') {
        await queryClient.invalidateQueries({ 
          queryKey: ['attachments', entityType, entityId] 
        });
      }
      
      // Invalidar queries específicas para projetos
      if (entityType === 'projeto') {
        await queryClient.invalidateQueries({ 
          queryKey: ['projeto-attachments'] 
        });
        await queryClient.invalidateQueries({ 
          queryKey: ['projeto-attachments', entityId] 
        });
      }
     
     // Wait a bit to ensure all queries are invalidated
     await new Promise(resolve => setTimeout(resolve, 100));
     
     // Force refetch of current data
     await refetch();
     
     // Toast de sucesso específico para projetos
     if (entityType === 'projeto') {
       toast({
         title: "Anexo adicionado ao projeto",
         description: `Arquivo: ${fileData.file_name}`,
       });
     }
     
     // Chamar callback de mudança
     if (onChanged) {
       console.log("AttachmentManager - Executando onChanged após upload");
       onChanged();
     }
     
     console.log("AttachmentManager - Processo de refresh completo");
   } catch (error) {
     console.error("AttachmentManager - Erro ao criar anexo:", error);
     
     // Toast de erro específico para projetos
     if (entityType === 'projeto') {
       toast({
         title: "Erro ao anexar arquivo ao projeto",
         description: "Tente novamente ou contate o suporte",
         variant: "destructive",
       });
     }
     
     throw error;
   }
 }, [entityType, entityId, createAttachment, onChanged, queryClient, refetch, toast]);

 const handleDeleteSuccess = async () => {
   console.log("AttachmentManager - Delete bem-sucedido, executando onChanged");
   
   // Invalidar todas as queries de anexos
   await queryClient.invalidateQueries({ 
     queryKey: ['attachments'] 
   });
   
   await queryClient.invalidateQueries({ 
     queryKey: ['financial-attachments'] 
   });
   
    // Invalidar queries específicas para produtos
    if (entityType === 'produto') {
      await queryClient.invalidateQueries({ 
        queryKey: ['attachments', entityType, entityId] 
      });
    }
    
    // Invalidar queries específicas para projetos
    if (entityType === 'projeto') {
      await queryClient.invalidateQueries({ 
        queryKey: ['projeto-attachments'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['projeto-attachments', entityId] 
      });
      
      toast({
        title: "Anexo removido do projeto",
      });
    }
   
   await refetch();
   
   if (onChanged) {
     onChanged();
   }
 };

 if (!entityId) {
   console.log("AttachmentManager - EntityId não fornecido");
   return null;
 }

  if (compact) {
    return (
      <AttachmentUpload 
        entityType={entityType}
        entityId={entityId}
        onUploadSuccess={handleUploadSuccess}
        compact={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AttachmentUpload 
        entityType={entityType}
        entityId={entityId}
        onUploadSuccess={handleUploadSuccess} 
      />
      <AttachmentList 
        entityType={entityType} 
        entityId={entityId}
        onChanged={handleDeleteSuccess}
      />
    </div>
  );
};
