
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
  const { createAttachment, refetch } = useAttachments(entityType, entityId);

  const handleUploadSuccess = async (fileData: {
    file_name: string;
    file_type: string;
    storage_path: string;
    storage_url: string;
    file_size: number;
  }) => {
    console.log("=== ATTACHMENT UPLOAD SUCCESS ===");
    console.log("AttachmentManager - Upload bem-sucedido para Supabase Storage, dados do arquivo:", fileData);
    console.log(`AttachmentManager - Tentando criar anexo no banco para entityType: ${entityType}, entityId: ${entityId}`);
    
    try {
      const result = await createAttachment(fileData);
      console.log("AttachmentManager - Anexo criado com sucesso no banco de dados:", result);
      
      // Refresh local dos anexos
      console.log("AttachmentManager - Fazendo refetch local dos anexos");
      await refetch();
      
      // Disparar refresh do componente pai imediatamente
      if (onRefreshParent) {
        console.log("AttachmentManager - Executando refresh do componente pai IMEDIATAMENTE");
        onRefreshParent();
      } else {
        console.warn("AttachmentManager - onRefreshParent não foi fornecido!");
      }
      
      console.log("=== ATTACHMENT PROCESS COMPLETED ===");
    } catch (error) {
      console.error("AttachmentManager - Erro ao criar anexo no banco:", error);
      throw error;
    }
  };

  if (!entityId) {
    console.log("AttachmentManager - EntityId não fornecido, não renderizando");
    return null;
  }

  console.log(`AttachmentManager - Renderizando para entityType: ${entityType}, entityId: ${entityId}`);

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
