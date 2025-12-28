import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { PushNotifications } from "@/lib/push-notifications";
import { formatCurrencyEUR } from "@/lib/utils/currency";

const pagamentoFornecedorSchema = z.object({
  valor_pagamento: z.string().min(1, "Valor é obrigatório"),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  data_pagamento: z.string().min(1, "Data é obrigatória"),
  observacoes: z.string().optional(),
});

type PagamentoFornecedorFormData = z.infer<typeof pagamentoFornecedorSchema>;

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  fornecedores?: { nome: string } | null;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
}

interface PagamentoFornecedorFormProps {
  onSuccess: () => void;
  conta: ContaPagar;
}

export default function PagamentoFornecedorForm({ onSuccess, conta }: PagamentoFornecedorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PagamentoFornecedorFormData>({
    resolver: zodResolver(pagamentoFornecedorSchema),
    defaultValues: {
      data_pagamento: new Date().toISOString().split('T')[0],
      forma_pagamento: "transferencia",
    },
  });

  const onSubmit = async (data: PagamentoFornecedorFormData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("pagamentos_fornecedor")
        .insert({
          encomenda_id: conta.encomenda_id,
          valor_pagamento: parseFloat(data.valor_pagamento),
          forma_pagamento: data.forma_pagamento,
          data_pagamento: data.data_pagamento,
          observacoes: data.observacoes,
        });

      if (error) throw error;

      // Enviar notificação por email
      try {
        const valorFormatado = `€${parseFloat(data.valor_pagamento).toFixed(2)}`;
        await sendEmail(
          emailRecipients.lipe,
          `💳 Pagamento realizado — ${conta.numero_encomenda}`,
          emailTemplates.pagamentoFornecedor(conta.numero_encomenda, 'N/A', valorFormatado)
        );
      } catch (emailError) {
        console.error("Erro ao enviar email de notificação:", emailError);
      }

      // Enviar push notification
      PushNotifications.pagamentoEfetuado(
        parseFloat(data.valor_pagamento),
        conta.fornecedores?.nome
      ).catch(() => { });

      toast({
        title: "Pagamento ao fornecedor lançado com sucesso!",
        description: "O pagamento foi registrado com sucesso.",
      });

      reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao lançar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-popover rounded-xl border border-border/20 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Fornecedor:</span>
            <p className="text-sm font-semibold truncate" title={conta.fornecedores?.nome || 'N/A'}>
              {conta.fornecedores?.nome || 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Total Custo:</span>
            <p className="text-sm font-bold">{formatCurrencyEUR(conta.valor_total_custo)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Pago:</span>
            <p className="text-sm font-bold text-success">{formatCurrencyEUR(conta.valor_pago_fornecedor)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Saldo:</span>
            <p className="text-sm font-black text-warning">{formatCurrencyEUR(conta.saldo_devedor_fornecedor)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor_pagamento" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Valor do Pagamento</Label>
            <div className="relative group">
              <Input
                id="valor_pagamento"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="pl-8 h-11 bg-popover border-border/40 font-semibold transition-all focus:ring-primary/20"
                {...register("valor_pagamento")}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">€</span>
            </div>
            {errors.valor_pagamento && <span className="text-xs text-red-500 font-medium tracking-tight">{errors.valor_pagamento.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pagamento" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Forma de Pagamento</Label>
            <Controller
              name="forma_pagamento"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-11 bg-popover border-border/40 font-semibold transition-all focus:ring-primary/20">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/40">
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="pix">MB Way / PIX</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.forma_pagamento && <span className="text-xs text-red-500 font-medium tracking-tight">{errors.forma_pagamento.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_pagamento" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Data do Pagamento</Label>
            <Input
              id="data_pagamento"
              type="date"
              className="h-11 bg-popover border-border/40 font-semibold transition-all focus:ring-primary/20"
              {...register("data_pagamento")}
            />
            {errors.data_pagamento && <span className="text-xs text-red-500 font-medium tracking-tight">{errors.data_pagamento.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Pagamento parcial referente à entrada..."
              className="min-h-[44px] bg-popover border-border/40 resize-none py-2.5 transition-all focus:ring-primary/20"
              {...register("observacoes")}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1 h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Lançar Pagamento"}
          </Button>
          <Button
            type="button"
            variant="cancel"
            className="flex-1 h-12 font-semibold bg-popover border-border/40"
            onClick={onSuccess}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
