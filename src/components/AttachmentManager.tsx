
import React from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/useAttachments';

interface AttachmentManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
  onRefreshParent?: () => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  entityType,
  entityId,
  title = "Anexos",
  onRefreshParent
}) => {
  const { createAttachment } = useAttachments(entityType, entityId);

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
      
      // Aguardar 2 segundos e então disparar refresh do componente pai
      if (onRefreshParent) {
        console.log("Agendando refresh do componente pai em 2 segundos...");
        setTimeout(() => {
          console.log("Executando refresh do componente pai");
          onRefreshParent();
        }, 2000);
      }
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
