
export interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  storage_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface AttachmentUploadData {
  file_name: string;
  file_type: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
}
