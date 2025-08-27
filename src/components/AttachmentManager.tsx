
import React, { useMemo } from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/useAttachments';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  // Memoizar o callback para evitar re-renders desnecessários
  const handleUploadSuccess = useMemo(() => async (fileData: {
    file_name: string;
    file_type: string;
    storage_path: string;
    storage_url: string;
    file_size: number;
  }) => {
    console.log("=== ATTACHMENT UPLOAD SUCCESS - Iniciando processo completo ===");
    console.log("AttachmentManager - Upload bem-sucedido, dados do arquivo:", fileData);
    console.log(`AttachmentManager - Criando anexo no banco para entityType: ${entityType}, entityId: ${entityId}`);
    
    try {
      const result = await createAttachment(fileData);
      console.log("AttachmentManager - Anexo criado com sucesso no banco de dados:", result);
      
      // Chamar onRefreshParent para atualizar produto pai se necessário
      if (onRefreshParent) {
        console.log("AttachmentManager - Chamando onRefreshParent para refresh do produto pai");
        await onRefreshParent();
        console.log("AttachmentManager - onRefreshParent executado com sucesso");
      } else {
        console.log("AttachmentManager - AVISO: onRefreshParent não fornecido");
      }
      
      console.log("=== ATTACHMENT PROCESS COMPLETED - Anexo adicionado e lista atualizada ===");
    } catch (error) {
      console.error("AttachmentManager - Erro ao criar anexo no banco:", error);
      throw error;
    }
  }, [entityType, entityId, createAttachment, onRefreshParent]);

  if (!entityId) {
    console.log("AttachmentManager - EntityId não fornecido, não renderizando");
    return null;
  }

  console.log(`AttachmentManager - Renderizando para entityType: ${entityType}, entityId: ${entityId}`);
  console.log("AttachmentManager - onRefreshParent callback:", onRefreshParent ? "PRESENTE" : "AUSENTE");

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
