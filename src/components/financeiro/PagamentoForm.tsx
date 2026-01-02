import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PushNotifications } from "@/lib/push-notifications";

const pagamentoSchema = z.object({
  encomenda_id: z.string().min(1, "Selecione uma encomenda"),
  valor_pagamento: z.string().min(1, "Valor é obrigatório"),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  data_pagamento: z.date(),
  observacoes: z.string().optional(),
});

type PagamentoFormData = z.infer<typeof pagamentoSchema>;

interface PagamentoFormProps {
  onSuccess: () => void;
  encomendas: Array<{
    id: string;
    numero_encomenda: string;
    cliente_nome: string;
    valor_total: number;
    valor_pago: number;
    saldo_devedor: number;
  }>;
}

export default function PagamentoForm({ onSuccess, encomendas }: PagamentoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PagamentoFormData>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      data_pagamento: new Date(),
    },
  });

  const selectedEncomendaId = watch("encomenda_id");
  const selectedEncomenda = encomendas.find((e) => e.id === selectedEncomendaId);

  const onSubmit = async (data: PagamentoFormData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.from("pagamentos").insert({
        encomenda_id: data.encomenda_id,
        valor_pagamento: parseFloat(data.valor_pagamento),
        forma_pagamento: data.forma_pagamento,
        data_pagamento: format(data.data_pagamento, "yyyy-MM-dd"),
        observacoes: data.observacoes,
      });

      if (error) throw error;

      // Enviar push notification
      PushNotifications.pagamentoRecebido(
        parseFloat(data.valor_pagamento),
        selectedEncomenda?.cliente_nome
      ).catch(() => { });

      toast({
        title: "Pagamento lançado com sucesso!",
        description: "O pagamento foi registrado e o saldo foi atualizado.",
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
    <div className="space-y-4">
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="encomenda_id"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Encomenda
            </Label>
            <Select
              value={selectedEncomendaId}
              onValueChange={(value) => setValue("encomenda_id", value)}
            >
              <SelectTrigger className="bg-popover border-border/40 h-11 font-semibold">
                <SelectValue placeholder="Selecione uma encomenda" />
              </SelectTrigger>
              <SelectContent>
                {encomendas.map((encomenda) => (
                  <SelectItem key={encomenda.id} value={encomenda.id}>
                    {encomenda.numero_encomenda} - {encomenda.cliente_nome}
                    (Saldo: €{encomenda.saldo_devedor.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.encomenda_id && (
              <p className="text-destructive text-sm font-medium">{errors.encomenda_id.message}</p>
            )}
          </div>

          {selectedEncomenda && (
            <div className="bg-popover border-border/20 space-y-3 rounded-xl border p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    Cliente:
                  </span>
                  <p className="text-sm font-semibold">{selectedEncomenda.cliente_nome}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    Total:
                  </span>
                  <p className="text-sm font-bold">€{selectedEncomenda.valor_total.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    Pago:
                  </span>
                  <p className="text-success text-sm font-bold">
                    €{selectedEncomenda.valor_pago.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    Saldo:
                  </span>
                  <p className="text-warning text-sm font-black">
                    €{selectedEncomenda.saldo_devedor.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="valor_pagamento"
                className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
              >
                Valor do Pagamento
              </Label>
              <Input
                id="valor_pagamento"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register("valor_pagamento")}
                className="bg-popover border-border/40 font-semibold"
              />
              {errors.valor_pagamento && (
                <p className="text-destructive text-sm font-medium">
                  {errors.valor_pagamento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="forma_pagamento"
                className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
              >
                Forma de Pagamento
              </Label>
              <Select onValueChange={(value) => setValue("forma_pagamento", value)}>
                <SelectTrigger className="bg-popover border-border/40 font-semibold">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX / MBWay</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
              {errors.forma_pagamento && (
                <p className="text-destructive text-sm font-medium">
                  {errors.forma_pagamento.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Data do Pagamento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "bg-popover border-border/40 w-full justify-start text-left font-semibold",
                    !watch("data_pagamento") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("data_pagamento")
                    ? format(watch("data_pagamento"), "PPP", { locale: ptBR })
                    : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch("data_pagamento")}
                  onSelect={(date) => date && setValue("data_pagamento", date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="observacoes"
              className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
            >
              Observações (Opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre o pagamento..."
              {...register("observacoes")}
              className="bg-popover border-border/40 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 flex-1 font-semibold text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? "Lançando..." : "Registrar Pagamento"}
            </Button>
            {onSuccess && (
              <Button
                type="button"
                variant="cancel"
                onClick={onSuccess}
                className="bg-popover border-border/40 font-semibold"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
