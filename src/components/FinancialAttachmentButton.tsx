
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Paperclip } from 'lucide-react';
import { AttachmentManager } from './AttachmentManager';
import { useAttachments } from '@/hooks/useAttachments';
import { Badge } from '@/components/ui/badge';

interface FinancialAttachmentButtonProps {
  entityId: string;
  entityType: 'financeiro';
  title?: string;
}

export const FinancialAttachmentButton: React.FC<FinancialAttachmentButtonProps> = ({
  entityId,
  entityType,
  title = "Anexar Fatura"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { attachments } = useAttachments(entityType, entityId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Paperclip className="h-4 w-4 mr-1" />
          {title}
          {attachments.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {attachments.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <AttachmentManager 
          entityType={entityType}
          entityId={entityId}
        />
      </DialogContent>
    </Dialog>
  );
};
