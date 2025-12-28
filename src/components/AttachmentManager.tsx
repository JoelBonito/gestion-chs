import React, { useMemo } from 'react';
import { AttachmentUpload } from './AttachmentUpload';
import { AttachmentList } from './AttachmentList';
import { useAttachments } from '@/hooks/useAttachments';
import { useTransporteAttachments } from '@/hooks/useTransporteAttachments';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail, emailTemplates, emailRecipients } from '@/lib/email';
import { Paperclip } from 'lucide-react';

interface AttachmentManagerProps {
  entityType: string;
  entityId: string;
  title?: string;
  onChanged?: () => void;
  compact?: boolean;
  useTertiaryLayer?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  entityType,
  entityId,
  title = "Anexos",
  onChanged,
  compact = false,
  useTertiaryLayer = false
}) => {
  const isTransporte = entityType === 'transporte';
  const genericAttachments = useAttachments(entityType, entityId);
  const transporteAttachments = useTransporteAttachments(isTransporte ? entityId : '');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUploadSuccess = useMemo(() => async (fileData: {
    file_name: string;
    file_type: string;
    storage_path: string;
    storage_url: string;
    file_size: number;
  }) => {
    console.log("AttachmentManager - Upload bem-sucedido:", fileData);
    console.log(`AttachmentManager - Criando anexo para ${entityType}:${entityId}`);

    try {
      let result;
      if (isTransporte) {
        // Usar hook específico de transportes
        result = await transporteAttachments.createAttachment({
          name: fileData.file_name,
          file_type: fileData.file_type,
          url: fileData.storage_url,
          file_size: fileData.file_size
        });
      } else {
        // Usar hook genérico
        result = await genericAttachments.createAttachment(fileData);
      }

      console.log("AttachmentManager - Anexo criado:", result);

      // Invalidar TODAS as queries relacionadas com anexos
      await queryClient.invalidateQueries({
        queryKey: ['attachments']
      });

      // Invalidar queries financeiras
      await queryClient.invalidateQueries({
        queryKey: ['financial-attachments']
      });

      // Invalidar queries específicas para produtos
      if (entityType === 'produto') {
        await queryClient.invalidateQueries({
          queryKey: ['attachments', entityType, entityId]
        });
      }

      // Invalidar queries específicas para projetos
      if (entityType === 'projeto') {
        await queryClient.invalidateQueries({
          queryKey: ['projeto-attachments']
        });
        await queryClient.invalidateQueries({
          queryKey: ['projeto-attachments', entityId]
        });
      }

      // Invalidar queries específicas para transportes
      if (entityType === 'transporte') {
        await queryClient.invalidateQueries({
          queryKey: ['transporte-attachments']
        });
        await queryClient.invalidateQueries({
          queryKey: ['transporte-attachments', entityId]
        });
      }

      // Wait a bit to ensure all queries are invalidated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force refetch of current data
      if (isTransporte) {
        await transporteAttachments.refetch();
      } else {
        await genericAttachments.refetch();
      }

      // Toast de sucesso específico para projetos
      if (entityType === 'projeto') {
        toast({
          title: "Anexo adicionado ao projeto",
          description: `Arquivo: ${fileData.file_name}`,
        });
      }

      // Enviar notificação por email para anexos de produtos
      if (entityType === 'produto') {
        try {
          // Buscar nome do produto
          const { data: produto } = await supabase
            .from('produtos')
            .select('nome')
            .eq('id', entityId)
            .single();

          if (produto) {
            await sendEmail(
              emailRecipients.felipe,
              `📎 Novo anexo — ${produto.nome}`,
              emailTemplates.novoAnexoProduto(produto.nome, fileData.storage_url)
            );
          }
        } catch (emailError) {
          console.error("Erro ao enviar email de notificação:", emailError);
          // Não exibir erro de email para não atrapalhar o fluxo principal
        }
      }

      // Chamar callback de mudança
      if (onChanged) {
        console.log("AttachmentManager - Executando onChanged após upload");
        onChanged();
      }

      console.log("AttachmentManager - Processo de refresh completo");
    } catch (error) {
      console.error("AttachmentManager - Erro ao criar anexo:", error);

      // Toast de erro específico para projetos
      if (entityType === 'projeto') {
        toast({
          title: "Erro ao anexar arquivo ao projeto",
          description: "Tente novamente ou contate o suporte",
          variant: "destructive",
        });
      }

      throw error;
    }
  }, [entityType, entityId, isTransporte, transporteAttachments, genericAttachments, onChanged, queryClient, toast]);

  const handleDeleteSuccess = async () => {
    console.log("AttachmentManager - Delete bem-sucedido, executando onChanged");

    // Invalidar todas as queries de anexos
    await queryClient.invalidateQueries({
      queryKey: ['attachments']
    });

    await queryClient.invalidateQueries({
      queryKey: ['financial-attachments']
    });

    // Invalidar queries específicas para produtos
    if (entityType === 'produto') {
      await queryClient.invalidateQueries({
        queryKey: ['attachments', entityType, entityId]
      });
    }

    // Invalidar queries específicas para projetos
    if (entityType === 'projeto') {
      await queryClient.invalidateQueries({
        queryKey: ['projeto-attachments']
      });
      await queryClient.invalidateQueries({
        queryKey: ['projeto-attachments', entityId]
      });

      toast({
        title: "Anexo removido do projeto",
      });
    }

    // Invalidar queries específicas para transportes
    if (entityType === 'transporte') {
      await queryClient.invalidateQueries({
        queryKey: ['transporte-attachments']
      });
      await queryClient.invalidateQueries({
        queryKey: ['transporte-attachments', entityId]
      });
    }

    if (isTransporte) {
      await transporteAttachments.refetch();
    } else {
      await genericAttachments.refetch();
    }

    if (onChanged) {
      onChanged();
    }
  };

  if (!entityId) {
    console.log("AttachmentManager - EntityId não fornecido");
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center">
        <AttachmentUpload
          entityType={entityType}
          entityId={entityId}
          onUploadSuccess={handleUploadSuccess}
          compact={true}
        />
        <AttachmentList
          entityType={entityType}
          entityId={entityId}
          onChanged={handleDeleteSuccess}
          compact={true}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 p-4 rounded-xl border ${useTertiaryLayer ? 'bg-popover border-border/40' : 'bg-card border-border/50'}`}>
      <div className="flex items-center justify-between border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            Documentos & Anexos
          </h3>
        </div>
        <AttachmentUpload
          entityType={entityType}
          entityId={entityId}
          onUploadSuccess={handleUploadSuccess}
          compact={false}
        />
      </div>

      <AttachmentList
        entityType={entityType}
        entityId={entityId}
        onChanged={handleDeleteSuccess}
        useTertiaryLayer={useTertiaryLayer}
      />
    </div>
  );
};