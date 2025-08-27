
import React, { useMemo } from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/useAttachments';
import { useQueryClient } from '@tanstack/react-query';

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
  const { createAttachment, refetch } = useAttachments(entityType, entityId);
  const queryClient = useQueryClient();

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
      
      // Invalidar todas as queries relacionadas com anexos
      await queryClient.invalidateQueries({ 
        queryKey: ['attachments', entityType, entityId] 
      });
      
      // Invalidar queries financeiras se necessário
      if (entityType === 'receivable' || entityType === 'payable' || entityType.includes('financeiro')) {
        await queryClient.invalidateQueries({ 
          queryKey: ['financial-attachments', entityType, entityId] 
        });
      }
      
      // Force refetch of current data
      await refetch();
      
      // Chamar callback de mudança
      if (onChanged) {
        console.log("AttachmentManager - Executando onChanged após upload");
        onChanged();
      }
      
      console.log("AttachmentManager - Processo de refresh completo");
    } catch (error) {
      console.error("AttachmentManager - Erro ao criar anexo:", error);
      throw error;
    }
  }, [entityType, entityId, createAttachment, onChanged, queryClient, refetch]);

  const handleDeleteSuccess = () => {
    console.log("AttachmentManager - Delete bem-sucedido, executando onChanged");
    if (onChanged) {
      onChanged();
    }
  };

  if (!entityId) {
    console.log("AttachmentManager - EntityId não fornecido");
    return null;
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
