export interface Invoice {
  id: string;
  invoice_date: string;
  amount: number;
  description?: string;
  attachment_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  attachment?: {
    id: string;
    file_name: string;
    file_type: string;
    storage_url: string;
    storage_path: string;
  };
}

export interface InvoiceFormData {
  invoice_date: string;
  amount: number;
  description?: string;
  file?: File;
}
