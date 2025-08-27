
export interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  created_by: string;
  created_at: string;
}

export interface AttachmentUploadData {
  file_name: string;
  file_type: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
}
