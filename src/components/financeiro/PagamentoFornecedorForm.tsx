import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { PushNotifications } from "@/lib/push-notifications";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { FORNECEDOR_PRODUCAO_ID } from "@/lib/permissions";

const DESTINATARIO_CATEGORIAS: Record<string, { label: string; categorias: { value: string; label: string }[] }> = {
  nonato: {
    label: "Nonato (Produção)",
    categorias: [
      { value: "garrafa", label: "Garrafa" },
      { value: "tampa", label: "Tampa" },
      { value: "producao", label: "Produção" },
    ],
  },
  carol: {
    label: "Carol (Manuseamento)",
    categorias: [
      { value: "embalagem", label: "Embalagem" },
      { value: "imposto", label: "Imposto" },
      { value: "frete", label: "Frete SP → Marseille" },
    ],
  },
};

const pagamentoFornecedorSchema = z.object({
  destinatario: z.string().optional(),
  categoria: z.string().optional(),
  valor_pagamento: z.string().min(1, "Valor é obrigatório"),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  data_pagamento: z.string().min(1, "Data é obrigatória"),
  observacoes: z.string().optional(),
});

type PagamentoFornecedorFormData = z.infer<typeof pagamentoFornecedorSchema>;

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  fornecedor_id?: string;
  fornecedores?: { nome: string } | null;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
}

interface PagamentoFornecedorFormProps {
  onSuccess: () => void;
  conta: ContaPagar;
  defaultDestinatario?: string;
}

export default function PagamentoFornecedorForm({
  onSuccess,
  conta,
  defaultDestinatario,
}: PagamentoFornecedorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isOnlus = conta.fornecedor_id === FORNECEDOR_PRODUCAO_ID;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PagamentoFornecedorFormData>({
    resolver: zodResolver(pagamentoFornecedorSchema),
    defaultValues: {
      destinatario: defaultDestinatario || "",
      categoria: "",
      data_pagamento: new Date().toISOString().split("T")[0],
      forma_pagamento: "transferencia",
    },
  });

  const watchDestinatario = watch("destinatario");

  useEffect(() => {
    setValue("categoria", "");
  }, [watchDestinatario, setValue]);

  const onSubmit = async (data: PagamentoFornecedorFormData) => {
    try {
      setIsLoading(true);

      if (isOnlus && !data.destinatario) {
        toast({ title: "Selecione o destinatário", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("pagamentos_fornecedor").insert({
        encomenda_id: conta.encomenda_id,
        destinatario: isOnlus ? data.destinatario : null,
        categoria: isOnlus ? data.categoria || null : null,
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
          `💳 Pagamento realizado — ${conta.numero_encomenda}${data.categoria ? ` (${data.categoria})` : ""}`,
          emailTemplates.pagamentoFornecedor(conta.numero_encomenda, "N/A", valorFormatado)
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
      <div className="bg-popover border-border/20 space-y-3 rounded-xl border p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Fornecedor:
            </span>
            <p className="truncate text-sm font-semibold" title={conta.fornecedores?.nome || "N/A"}>
              {conta.fornecedores?.nome || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Total Custo:
            </span>
            <p className="text-sm font-bold">{formatCurrencyEUR(conta.valor_total_custo)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Pago:
            </span>
            <p className="text-success text-sm font-bold">
              {formatCurrencyEUR(conta.valor_pago_fornecedor)}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Saldo:
            </span>
            <p className="text-warning text-sm font-black">
              {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {/* Destinatário + Categoria — só para ONL'US */}
          {isOnlus && (
          <>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Destinatário
            </Label>
            <Controller
              name="destinatario"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-popover border-border/40 focus:ring-primary/20 h-11 font-semibold transition-all">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/40">
                    {Object.entries(DESTINATARIO_CATEGORIAS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.destinatario && (
              <span className="text-xs font-medium tracking-tight text-red-500">
                {errors.destinatario.message}
              </span>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Categoria <span className="font-normal normal-case tracking-normal">(opcional)</span>
            </Label>
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!watchDestinatario}>
                  <SelectTrigger className="bg-popover border-border/40 focus:ring-primary/20 h-11 font-semibold transition-all">
                    <SelectValue placeholder={watchDestinatario ? "Selecione..." : "Escolha o destinatário primeiro"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/40">
                    {watchDestinatario && DESTINATARIO_CATEGORIAS[watchDestinatario]?.categorias.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoria && (
              <span className="text-xs font-medium tracking-tight text-red-500">
                {errors.categoria.message}
              </span>
            )}
          </div>
          </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="valor_pagamento"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Valor do Pagamento
            </Label>
            <div className="group relative">
              <Input
                id="valor_pagamento"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="bg-popover border-border/40 focus:ring-primary/20 h-11 pl-8 font-semibold transition-all"
                {...register("valor_pagamento")}
              />
              <span className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 transition-colors">
                €
              </span>
            </div>
            {errors.valor_pagamento && (
              <span className="text-xs font-medium tracking-tight text-red-500">
                {errors.valor_pagamento.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="forma_pagamento"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Forma de Pagamento
            </Label>
            <Controller
              name="forma_pagamento"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-popover border-border/40 focus:ring-primary/20 h-11 font-semibold transition-all">
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
            {errors.forma_pagamento && (
              <span className="text-xs font-medium tracking-tight text-red-500">
                {errors.forma_pagamento.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="data_pagamento"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Data do Pagamento
            </Label>
            <Input
              id="data_pagamento"
              type="date"
              className="bg-popover border-border/40 focus:ring-primary/20 h-11 font-semibold transition-all"
              {...register("data_pagamento")}
            />
            {errors.data_pagamento && (
              <span className="text-xs font-medium tracking-tight text-red-500">
                {errors.data_pagamento.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="observacoes"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Observações
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Pagamento parcial referente à entrada..."
              className="bg-popover border-border/40 focus:ring-primary/20 min-h-[44px] resize-none py-2.5 transition-all"
              {...register("observacoes")}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 shadow-primary/20 h-12 flex-1 text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Lançar Pagamento"}
          </Button>
          <Button
            type="button"
            variant="cancel"
            className="bg-popover border-border/40 h-12 flex-1 font-semibold"
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
