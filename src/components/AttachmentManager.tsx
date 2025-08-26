
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
    console.log("Upload bem-sucedido, dados do arquivo:", fileData);
    try {
      await createAttachment(fileData);
      console.log("Anexo criado com sucesso, fazendo refresh da lista");
      // Força atualização da lista de anexos
      await refetch();
    } catch (error) {
      console.error("Erro ao criar anexo:", error);
    }
  };

  if (!entityId) {
    console.log("EntityId não fornecido, não renderizando AttachmentManager");
    return null;
  }

  console.log("Renderizando AttachmentManager para:", { entityType, entityId });

  return (
    <div className="space-y-6">
      <AttachmentUpload onUploadSuccess={handleUploadSuccess} />
      <AttachmentList entityType={entityType} entityId={entityId} />
    </div>
  );
};
