
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
  const { createAttachment } = useAttachments(entityType, entityId);

  const handleUploadSuccess = async (fileData: {
    file_name: string;
    file_type: string;
    gdrive_file_id: string;
    gdrive_view_link: string;
    gdrive_download_link: string;
    file_size: number;
  }) => {
    await createAttachment(fileData);
  };

  if (!entityId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AttachmentUpload onUploadSuccess={handleUploadSuccess} />
      <AttachmentList entityType={entityType} entityId={entityId} />
    </div>
  );
};
