
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Eye, Download, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Attachment } from "@/types/domain";

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete: (attachment: Attachment) => void;
  isLoading?: boolean;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onDelete,
  isLoading = false
}) => {
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800';
    if (fileType.includes('image')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');
  const isPDF = (fileType: string) => fileType === 'application/pdf';

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum anexo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Badge className={`text-xs ${getFileTypeColor(attachment.file_type)}`}>
              {attachment.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
            </Badge>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.file_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Preview Button */}
            {(isImage(attachment.file_type) || isPDF(attachment.file_type)) && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="max-w-4xl max-h-[90vh] overflow-auto"
                  aria-describedby={undefined}
                >
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{attachment.file_name}</DialogTitle>
                    <DialogClose asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                  </DialogHeader>
                  <div className="mt-4">
                    {isImage(attachment.file_type) ? (
                      <img
                        src={attachment.storage_url || ''}
                        alt={attachment.file_name}
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : (
                      <iframe
                        src={attachment.storage_url || ''}
                        className="w-full h-[600px] border rounded-lg"
                        title={attachment.file_name}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (attachment.storage_url) {
                  const link = document.createElement('a');
                  link.href = attachment.storage_url;
                  link.download = attachment.file_name;
                  link.target = '_blank';
                  link.click();
                }
              }}
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(attachment)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
