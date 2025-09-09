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
      console.log("
