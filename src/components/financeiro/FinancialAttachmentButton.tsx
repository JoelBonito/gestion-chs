import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Paperclip, Upload } from "lucide-react";
import { AttachmentManager } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { supabase } from "@/integrations/supabase/client";
import { IconWithBadge } from "@/components/ui/icon-with-badge";

interface FinancialAttachmentButtonProps {
  entityId: string;
  entityType: "receivable" | "payable" | "financeiro";
  title?: string;
  onChanged?: () => void;
  className?: string;
  showLabel?: boolean;
}

export const FinancialAttachmentButton: React.FC<FinancialAttachmentButtonProps> = ({
  entityId,
  entityType,
  title = "Anexar Comprovante",
  onChanged,
  className,
  showLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [hasLoadedCount, setHasLoadedCount] = useState(false);
  const { hasRole, isHardcodedAdmin } = useUserRole();
  const { isCollaborator } = useIsCollaborator();

  // Check if user can access financial attachments
  const canAccess =
    isHardcodedAdmin ||
    hasRole("admin") ||
    hasRole("finance") ||
    hasRole("factory") ||
    isCollaborator;

  // Load attachment count only when dialog opens or component mounts
  const loadAttachmentCount = async () => {
    if (hasLoadedCount) return;

    try {
      const { count, error } = await supabase
        .from("attachments")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);

      if (error) {
        console.error("Error loading attachment count:", error);
        return;
      }

      setAttachmentCount(count || 0);
      setHasLoadedCount(true);
    } catch (error) {
      console.error("Error loading attachment count:", error);
    }
  };

  // Load count when dialog opens
  useEffect(() => {
    if (isOpen && !hasLoadedCount) {
      loadAttachmentCount();
    }
  }, [isOpen]);

  const handleAttachmentChange = () => {
    console.log("FinancialAttachmentButton - Attachment changed, reloading count");
    setHasLoadedCount(false); // Force reload count
    loadAttachmentCount();
    onChanged?.();
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !hasLoadedCount) {
      loadAttachmentCount();
    }
  };

  if (!canAccess) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("relative gap-2", className)}
          title="Anexar comprovante"
          type="button"
          onMouseEnter={() => !hasLoadedCount && loadAttachmentCount()}
        >
          <IconWithBadge
            icon={<Paperclip className="h-4 w-4" />}
            count={hasLoadedCount ? attachmentCount : 0}
          />
          {showLabel && <span>Anexos</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
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
