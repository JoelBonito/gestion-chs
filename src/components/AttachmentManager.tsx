
import React from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/useAttachments';

interface AttachmentManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  entityType,
  entityId,
  title = "Anexos"
}) => {
  const { createAttachment, refetch } = useAttachments(entityType, entityId);

  const handleUploadSuccess = async (fileData: {
    file_name: string;
    file_type: string;
    storage_path: string;
    storage_url: string;
    file_size: number;
  }) => {
    console.log("Upload bem-sucedido para Supabase Storage, dados do arquivo:", fileData);
    console.log(`Tentando criar anexo no banco de dados para entityType: ${entityType}, entityId: ${entityId}`);
    
    try {
      const result = await createAttachment(fileData);
      console.log("Anexo criado com sucesso no banco de dados:", result);
      
      // Não precisa do refetch aqui pois o createAttachment já atualiza a lista local
      console.log("Lista de anexos atualizada automaticamente");
    } catch (error) {
      console.error("Erro ao criar anexo no banco:", error);
      throw error;
    }
  };

  if (!entityId) {
    console.log("EntityId não fornecido, não renderizando AttachmentManager");
    return null;
  }

  console.log(`Renderizando AttachmentManager para entityType: ${entityType}, entityId: ${entityId}`);

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
      />
    </div>
  );
};
