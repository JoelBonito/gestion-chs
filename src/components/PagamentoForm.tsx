import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const selectedEncomenda = encomendas.find(e => e.id === selectedEncomendaId);

  const onSubmit = async (data: PagamentoFormData) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("pagamentos")
        .insert({
          encomenda_id: data.encomenda_id,
          valor_pagamento: parseFloat(data.valor_pagamento),
          forma_pagamento: data.forma_pagamento,
          data_pagamento: format(data.data_pagamento, "yyyy-MM-dd"),
          observacoes: data.observacoes,
        });

      if (error) throw error;

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
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Lançar Pagamento</CardTitle>
        <CardDescription>
          Registre um pagamento associado a uma encomenda específica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encomenda_id">Encomenda</Label>
            <Select
              value={selectedEncomendaId}
              onValueChange={(value) => setValue("encomenda_id", value)}
            >
              <SelectTrigger>
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
              <p className="text-sm text-destructive">{errors.encomenda_id.message}</p>
            )}
          </div>

          {selectedEncomenda && (
            <div className="p-3 bg-muted/30 rounded-lg space-y-1">
              <p className="text-sm font-medium">Detalhes da Encomenda:</p>
              <p className="text-sm text-muted-foreground">
                Cliente: {selectedEncomenda.cliente_nome}
              </p>
              <p className="text-sm text-muted-foreground">
                Valor Total: €{selectedEncomenda.valor_total.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Valor Pago: €{selectedEncomenda.valor_pago.toFixed(2)}
              </p>
              <p className="text-sm font-semibold text-warning">
                Saldo Devedor: €{selectedEncomenda.saldo_devedor.toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="valor_pagamento">Valor do Pagamento</Label>
            <Input
              id="valor_pagamento"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register("valor_pagamento")}
            />
            {errors.valor_pagamento && (
              <p className="text-sm text-destructive">{errors.valor_pagamento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Select onValueChange={(value) => setValue("forma_pagamento", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
            {errors.forma_pagamento && (
              <p className="text-sm text-destructive">{errors.forma_pagamento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watch("data_pagamento") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch("data_pagamento") 
                    ? format(watch("data_pagamento"), "PPP", { locale: ptBR })
                    : "Selecione uma data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
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
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre o pagamento..."
              {...register("observacoes")}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? "Lançando..." : "Lançar Pagamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}