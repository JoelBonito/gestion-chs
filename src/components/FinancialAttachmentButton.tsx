
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Paperclip, Upload } from 'lucide-react';
import { AttachmentManager } from './AttachmentManager';
import { useAttachments } from '@/hooks/useAttachments';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';

interface FinancialAttachmentButtonProps {
  entityId: string;
  entityType: 'receivable' | 'payable' | 'financeiro';
  title?: string;
  onChanged?: () => void;
}

export const FinancialAttachmentButton: React.FC<FinancialAttachmentButtonProps> = ({
  entityId,
  entityType,
  title = "Anexar Comprovante",
  onChanged
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { attachments, refetch } = useAttachments(entityType, entityId);
  const { hasRole } = useUserRole();
  
  // Check if user can access financial attachments
  const canAccess = hasRole('admin') || hasRole('finance');

  const handleAttachmentChange = async () => {
    console.log("FinancialAttachmentButton - Attachment changed, forcing refresh");
    await refetch();
    onChanged?.();
  };

  if (!canAccess) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          title="Anexar comprovante"
          type="button"
        >
          <Paperclip className="h-4 w-4 mr-1" />
          Anexar
          {attachments.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {attachments.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <AttachmentManager 
          entityType={entityType}
          entityId={entityId}
          title={title}
          onChanged={handleAttachmentChange}
        />
      </DialogContent>
    </Dialog>
  );
};
