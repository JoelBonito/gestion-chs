
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
    console.log("=== ATTACHMENT UPLOAD SUCCESS - Refresh interno ===");
    console.log("AttachmentManager - Upload bem-sucedido, dados do arquivo:", fileData);
    console.log(`AttachmentManager - Criando anexo no banco para entityType: ${entityType}, entityId: ${entityId}`);
    
    try {
      const result = await createAttachment(fileData);
      console.log("AttachmentManager - Anexo criado com sucesso no banco de dados:", result);
      
      // Refresh interno da lista de anexos
      console.log("AttachmentManager - Fazendo refetch interno dos anexos");
      await refetch();
      
      // O onRefreshParent não é mais necessário para refresh da lista geral
      // Mantemos apenas para compatibilidade, mas não será usado para refresh da página de produtos
      console.log("AttachmentManager - Refresh interno concluído com sucesso");
      
      console.log("=== ATTACHMENT PROCESS COMPLETED - Anexo disponível na lista ===");
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
