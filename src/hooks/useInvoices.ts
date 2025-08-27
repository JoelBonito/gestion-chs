
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseStorage } from './useSupabaseStorage';
import { Invoice, InvoiceFormData } from '@/types/invoice';

export const useInvoices = () => {
  const { toast } = useToast();
  const { uploadFile, deleteFile } = useSupabaseStorage();
  const queryClient = useQueryClient();
  
  const queryKey = ['invoices'];

  const {
    data: invoices = [],
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<Invoice[]> => {
      console.log('useInvoices - Buscando faturas');
      
      // Buscar faturas da tabela criada
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (invoicesError) {
        console.error("useInvoices - Erro:", invoicesError);
        throw invoicesError;
      }

      if (!invoicesData || invoicesData.length === 0) {
        console.log('useInvoices - Nenhuma fatura encontrada');
        return [];
      }

      // Buscar anexos para faturas que tenham attachment_id
      const invoicesWithAttachments = await Promise.all(
        invoicesData.map(async (invoice: any) => {
          if (invoice.attachment_id) {
            const { data: attachment } = await supabase
              .from('attachments')
              .select('id, file_name, file_type, storage_url, storage_path')
              .eq('id', invoice.attachment_id)
              .single();
            
            return {
              ...invoice,
              attachment
            };
          }
          return invoice;
        })
      );
      
      console.log(`useInvoices - Encontradas ${invoicesWithAttachments.length} faturas`);
      return invoicesWithAttachments as Invoice[];
    },
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0 // Não manter cache
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: InvoiceFormData) => {
      console.log('useInvoices - Criando fatura', invoiceData);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      let attachmentId = null;

      // Upload do arquivo se fornecido
      if (invoiceData.file) {
        const date = new Date(invoiceData.invoice_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        const result = await uploadFile(
          invoiceData.file, 
          `faturas/${year}/${month}`,
          `invoice-${Date.now()}`
        );

        if (!result) {
          throw new Error("Erro no upload do arquivo");
        }

        // Criar registro na tabela attachments
        const { data: attachment, error: attachmentError } = await supabase
          .from('attachments')
          .insert([{
            entity_type: 'invoice',
            entity_id: 'temp', // Será atualizado após criar a fatura
            file_name: result.fileName,
            file_type: result.mimeType,
            storage_path: result.path,
            storage_url: result.publicUrl,
            file_size: result.size,
            uploaded_by: user.id
          }])
          .select()
          .single();

        if (attachmentError) {
          console.error("useInvoices - Erro ao criar attachment:", attachmentError);
          throw attachmentError;
        }

        attachmentId = attachment.id;
      }

      // Criar a fatura usando a tabela correta
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_date: invoiceData.invoice_date,
          amount: invoiceData.amount,
          description: invoiceData.description || null,
          attachment_id: attachmentId,
          created_by: user.id
        }])
        .select()
        .single();

      if (invoiceError) {
        console.error("useInvoices - Erro ao criar fatura:", invoiceError);
        throw invoiceError;
      }

      // Atualizar entity_id do attachment se necessário
      if (attachmentId) {
        await supabase
          .from('attachments')
          .update({ entity_id: invoice.id })
          .eq('id', attachmentId);
      }
      
      return invoice;
    },
    onSuccess: async () => {
      console.log("useInvoices - Fatura criada com sucesso");
      await queryClient.invalidateQueries({ queryKey });
      refetch();
      toast({
        title: "Fatura criada",
        description: "Fatura salva com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("useInvoices - Erro ao criar fatura:", error);
      toast({
        title: "Erro ao criar fatura",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => {
      console.log("useInvoices - Atualizando fatura:", id);

      const { error } = await supabase
        .from('invoices')
        .update({
          invoice_date: data.invoice_date,
          amount: data.amount,
          description: data.description || null
        })
        .eq('id', id);

      if (error) throw error;

      return { id, ...data };
    },
    onSuccess: async () => {
      console.log("useInvoices - Fatura atualizada com sucesso");
      await queryClient.invalidateQueries({ queryKey });
      refetch();
      toast({
        title: "Fatura atualizada",
        description: "Fatura atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("useInvoices - Erro ao atualizar fatura:", error);
      toast({
        title: "Erro ao atualizar fatura",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      console.log("useInvoices - Deletando fatura:", invoice);

      // Deletar arquivo do storage se existir
      if (invoice.attachment?.storage_path) {
        await deleteFile(invoice.attachment.storage_path);
      }

      // Deletar attachment se existir
      if (invoice.attachment_id) {
        await supabase
          .from('attachments')
          .delete()
          .eq('id', invoice.attachment_id);
      }

      // Deletar fatura
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;

      return invoice;
    },
    onSuccess: async () => {
      console.log("useInvoices - Fatura deletada com sucesso");
      await queryClient.invalidateQueries({ queryKey });
      refetch();
      toast({
        title: "Fatura removida",
        description: "Fatura removida com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("useInvoices - Erro ao remover fatura:", error);
      toast({
        title: "Erro ao remover fatura",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    invoices,
    isLoading,
    error,
    refetch,
    createInvoice: createInvoiceMutation.mutate,
    updateInvoice: (id: string, data: { invoice_date: string; amount: number; description?: string }) => 
      updateInvoiceMutation.mutate({ id, data }),
    deleteInvoice: deleteInvoiceMutation.mutate,
    isCreating: createInvoiceMutation.isPending,
    isUpdating: updateInvoiceMutation.isPending,
    isDeleting: deleteInvoiceMutation.isPending
  };
};
