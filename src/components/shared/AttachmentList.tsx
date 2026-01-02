import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, FileText, Image, File, ExternalLink, X } from "lucide-react";
import { useAttachments } from "@/hooks/useAttachments";
import { useTransporteAttachments } from "@/hooks/useTransporteAttachments";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AttachmentListProps {
  entityType: string;
  entityId: string;
  onChanged?: () => void;
  compact?: boolean;
  useTertiaryLayer?: boolean;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  entityType,
  entityId,
  onChanged,
  compact = false,
  useTertiaryLayer = false,
}) => {
  const isTransporte = entityType === "transporte";
  const genericAttachments = useAttachments(entityType, entityId);
  const transporteAttachments = useTransporteAttachments(isTransporte ? entityId : "");

  // Use the appropriate hook based on entity type
  const { attachments, isLoading, deleteAttachment } = isTransporte
    ? transporteAttachments
    : genericAttachments;

  const { canEdit } = useUserRole();
  const { user } = useAuth();
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";

  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      "Nenhum anexo encontrado": {
        pt: "Nenhum anexo encontrado",
        fr: "Aucune pièce jointe trouvée",
      },
      Visualizar: { pt: "Visualizar", fr: "Voir" },
      Baixar: { pt: "Baixar", fr: "Télécharger" },
      Excluir: { pt: "Excluir", fr: "Supprimer" },
      "Tamanho desconhecido": { pt: "Tamanho desconhecido", fr: "Taille inconnue" },
      "Tem certeza que deseja excluir este anexo?": {
        pt: "Tem certeza que deseja excluir este anexo?",
        fr: "Êtes-vous sûr de vouloir supprimer cette pièce jointe ?",
      },
      "PDF será aberto em nova aba.": {
        pt: "PDF será aberto em nova aba.",
        fr: "Le PDF s'ouvrira dans um nouvel onglet.",
      },
      "Abrir PDF": { pt: "Abrir PDF", fr: "Ouvrir le PDF" },
      "Prévia não disponível para este tipo de arquivo.": {
        pt: "Prévia não disponível para este tipo de arquivo.",
        fr: "Aperçu non disponible pour ce type de fichier.",
      },
      "Baixar Arquivo": { pt: "Baixar Arquivo", fr: "Télécharger le fichier" },
    };
    return d[k]?.[lang] || k;
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Check if user can delete files
  const canDelete = canEdit();

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (fileType?.includes("pdf")) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return t("Tamanho desconhecido");

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const downloadFile = async (attachment: any) => {
    try {
      console.log("Downloading attachment:", attachment);

      let fileUrl: string;
      if (isTransporte) {
        fileUrl = attachment.url;
      } else {
        fileUrl = attachment.storage_url;
      }

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = isTransporte ? attachment.name : attachment.file_name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getPublicUrl = async (storagePath: string) => {
    try {
      const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error getting public URL:", error);
      return null;
    }
  };

  const handlePreview = async (attachment: any) => {
    console.log("Preview attachment:", attachment);

    try {
      let fileUrl: string;
      let fileName: string;
      let fileType: string;

      if (isTransporte) {
        fileUrl = attachment.url;
        fileName = attachment.name;
        fileType = attachment.file_type;
      } else {
        fileUrl = attachment.storage_url;
        fileName = attachment.file_name;
        fileType = attachment.file_type;
      }

      // Para PDFs, abrir em nova aba em vez de modal
      if (fileType?.includes("pdf")) {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
        return;
      }

      setPreviewUrl(fileUrl);
      setPreviewType(fileType);
      setPreviewTitle(fileName);
    } catch (error) {
      console.error("Error previewing file:", error);
    }
  };

  const handleDelete = async (attachment: any) => {
    if (!window.confirm(t("Tem certeza que deseja excluir este anexo?"))) {
      return;
    }

    try {
      await deleteAttachment(attachment);
      if (onChanged) onChanged();
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    if (previewType?.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          <img src={previewUrl} alt={previewTitle} className="max-h-96 max-w-full object-contain" />
        </div>
      );
    } else if (previewType?.includes("pdf")) {
      // PDFs agora abrem em nova aba, mas mantemos este código para casos especiais
      return (
        <div className="p-8 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50" />
          <p>{t("PDF será aberto em nova aba.")}</p>
          <Button
            onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
            className="mt-4"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("Abrir PDF")}
          </Button>
        </div>
      );
    } else {
      return (
        <div className="p-8 text-center">
          <File className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50" />
          <p>{t("Prévia não disponível para este tipo de arquivo.")}</p>
          <Button
            onClick={() =>
              downloadFile({
                [isTransporte ? "url" : "storage_url"]: previewUrl,
                [isTransporte ? "name" : "file_name"]: previewTitle,
              })
            }
            className="mt-4"
          >
            <Download className="mr-2 h-4 w-4" />
            {t("Baixar Arquivo")}
          </Button>
        </div>
      );
    }
  };

  if (isLoading) {
    return compact ? null : (
      <div className="flex items-center justify-center p-4">
        <div className="border-primary h-6 w-6 animate-spin rounded-lg border-b-2"></div>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return compact ? null : (
      <div className="text-muted-foreground p-4 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">{t("Nenhum anexo encontrado")}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {attachments.slice(0, 2).map((attachment) => (
          <Button
            key={attachment.id}
            variant="ghost"
            size="icon"
            onClick={() => handlePreview(attachment)}
            title={isTransporte ? attachment.name : attachment.file_name}
            className="h-8 w-8"
          >
            {getFileIcon(attachment.file_type)}
          </Button>
        ))}
        {attachments.length > 2 && (
          <Badge variant="secondary" className="px-1 text-xs">
            +{attachments.length - 2}
          </Badge>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent
            className="bg-accent border-border/50 max-h-[90vh] max-w-4xl overflow-auto"
            aria-describedby=""
          >
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{previewTitle}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewUrl(null)}
                  className="group rounded-full transition-all duration-300 hover:rotate-90 hover:bg-red-500/10 hover:text-red-500"
                >
                  <X className="h-4 w-4 transition-transform" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            {renderPreviewContent()}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={`group border-border/40 relative flex items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
            useTertiaryLayer
              ? "bg-accent hover:bg-accent/80 shadow-sm"
              : "bg-accent/20 hover:bg-accent/40"
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <div className="bg-background text-muted-foreground group-hover:text-primary rounded-lg p-2 transition-colors">
              {getFileIcon(attachment.file_type)}
            </div>

            <div className="min-w-0 flex-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="group-hover:text-primary max-w-[180px] cursor-help truncate text-sm font-semibold transition-colors sm:max-w-[320px] md:max-w-[420px]">
                      {isTransporte ? attachment.name : attachment.file_name}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-[300px] break-all">
                    {isTransporte ? attachment.name : attachment.file_name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-muted-foreground flex items-center space-x-2 text-[10px] font-medium tracking-tight uppercase">
                <span>{formatFileSize(attachment.file_size)}</span>
                <span className="opacity-30">•</span>
                <span>
                  {new Date(attachment.created_at).toLocaleDateString(isHam ? "fr-FR" : "pt-BR")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePreview(attachment)}
              title={t("Visualizar")}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 transition-all hover:scale-110 active:scale-90"
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => downloadFile(attachment)}
              title={t("Baixar")}
              className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-emerald-500/10 hover:text-emerald-500 active:scale-90"
            >
              <Download className="h-4 w-4" />
            </Button>

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(attachment)}
                title={t("Excluir")}
                className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-red-500/10 hover:text-red-500 active:scale-90"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent
          className="bg-accent border-border/50 max-h-[90vh] max-w-4xl overflow-auto"
          aria-describedby=""
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewTitle}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewUrl(null)}
                className="group rounded-full transition-all duration-300 hover:rotate-90 hover:bg-red-500/10 hover:text-red-500"
              >
                <X className="h-4 w-4 transition-transform" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {renderPreviewContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
