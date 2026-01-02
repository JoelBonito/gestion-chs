import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Paperclip, Upload, FileText, Eye, Download, Trash2, ExternalLink } from "lucide-react";

interface ProjetoAttachmentManagerProps {
  projetoId: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  storage_url: string;
  file_size: number;
}

export const ProjetoAttachmentManager: React.FC<ProjetoAttachmentManagerProps> = ({
  projetoId,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewModal, setPreviewModal] = useState<{ url: string; fileName: string } | null>(null);
  const { uploadFile, isUploading } = useSupabaseStorage();
  const { hasRole } = useUserRole();
  const canManage = hasRole("admin");

  const fetchAttachments = async () => {
    if (!projetoId) return;
    const { data, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("entity_type", "projeto")
      .eq("entity_id", projetoId)
      .order("id", { ascending: false });
    if (error) {
      console.error("Erro ao carregar anexos:", error);
      return;
    }
    setAttachments(data || []);
  };

  useEffect(() => {
    fetchAttachments();
  }, [projetoId]);

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("attachments").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const result = await uploadFile(
        selectedFile,
        `projetos/${projetoId}`,
        `projeto-${projetoId}-${Date.now()}`
      );

      if (!result) throw new Error("Erro no upload");

      const { error } = await supabase.from("attachments").insert([
        {
          entity_type: "projeto",
          entity_id: projetoId,
          file_name: result.fileName,
          file_type: result.mimeType,
          storage_path: result.path,
          storage_url: result.publicUrl,
          file_size: result.size,
          uploaded_by: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Anexo adicionado com sucesso!");
      setSelectedFile(null);
      setIsUploadOpen(false);
      fetchAttachments();
    } catch (err: any) {
      toast.error("Erro ao enviar anexo: " + err.message);
    }
  };

  const handleRemove = async (attachment: Attachment) => {
    if (!canManage) return;
    if (!confirm("Remover este anexo?")) return;
    try {
      await supabase.storage.from("attachments").remove([attachment.storage_path]);
      await supabase.from("attachments").delete().eq("id", attachment.id);
      toast.success("Anexo removido");
      fetchAttachments();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-medium">
          <Paperclip className="h-4 w-4" />
          Anexos do Projeto
        </h3>
        {canManage && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Anexo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo</Label>
                  <Input id="file" type="file" onChange={handleFileChange} />
                  <p className="text-muted-foreground text-xs">
                    Apenas arquivos até 10MB são permitidos.
                  </p>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  variant="gradient"
                  className="w-full"
                >
                  {isUploading ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum anexo encontrado</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="bg-accent border-border/40 hover:border-primary/30 group flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2 dark:bg-red-500/20">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="line-clamp-1 text-sm font-medium">{att.file_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {(att.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setPreviewModal({
                      url: getPublicUrl(att.storage_path),
                      fileName: att.file_name,
                    })
                  }
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(getPublicUrl(att.storage_path), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    const response = await fetch(getPublicUrl(att.storage_path));
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = att.file_name;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemove(att)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewModal && (
        <Dialog open={!!previewModal} onOpenChange={() => setPreviewModal(null)}>
          <DialogContent className="bg-accent border-border/50 max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewModal.fileName}</DialogTitle>
            </DialogHeader>
            <iframe src={previewModal.url} className="h-[70vh] w-full" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
