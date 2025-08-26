
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
    gdrive_file_id: string;
    gdrive_view_link: string;
    gdrive_download_link: string;
    file_size: number;
  }) => {
    console.log("Upload bem-sucedido para Google Drive, dados do arquivo:", fileData);
    console.log("Tentando criar anexo no banco de dados para:", { entityType, entityId });
    
    try {
      const result = await createAttachment(fileData);
      console.log("Anexo criado com sucesso no banco de dados:", result);
      console.log("Fazendo refresh da lista de anexos...");
      // Força atualização da lista de anexos
      await refetch();
      console.log("Lista de anexos atualizada");
    } catch (error) {
      console.error("Erro ao criar anexo no banco:", error);
      // Re-throw para que o erro seja mostrado no toast
      throw error;
    }
  };

  if (!entityId) {
    console.log("EntityId não fornecido, não renderizando AttachmentManager");
    return null;
  }

  console.log("Renderizando AttachmentManager para:", { entityType, entityId });

  return (
    <div className="space-y-6">
      <AttachmentUpload 
        entityType={entityType}
        entityId={entityId}
        onUploadSuccess={handleUploadSuccess} 
      />
      <AttachmentList entityType={entityType} entityId={entityId} />
    </div>
  );
};
