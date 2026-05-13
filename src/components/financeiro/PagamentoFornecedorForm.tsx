import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { brlToEur, fetchExchangeRate, formatCurrencyEUR, formatCurrencyBRL } from "@/lib/utils/currency";
import { FORNECEDOR_PRODUCAO_ID } from "@/lib/permissions";
import { FornecedorSelect } from "@/components/shared";

const ITEM_TIPOS = [
  { value: "garrafa", label: "Garrafa", moeda: "BRL" as const },
  { value: "tampa", label: "Tampa", moeda: "BRL" as const },
  { value: "rotulo", label: "Rótulo", moeda: "BRL" as const },
  { value: "producao", label: "Produção", moeda: "BRL" as const },
  { value: "frete_sp", label: "Frete SP", moeda: "BRL" as const },
  { value: "embalagem", label: "Embalagem", moeda: "BRL" as const },
  { value: "imposto", label: "Imposto", moeda: "BRL" as const },
  { value: "diversos", label: "Diversos", moeda: "BRL" as const },
  { value: "frete_internacional", label: "Frete Internacional", moeda: "EUR" as const },
];

const ITEM_TO_DESTINATARIO: Record<string, string> = {
  garrafa: "nonato",
  tampa: "nonato",
  rotulo: "nonato",
  producao: "nonato",
  frete_sp: "carol",
  embalagem: "carol",
  imposto: "carol",
  diversos: "nonato",
  frete_internacional: "carol",
};

const ITEM_TO_CATEGORIA: Record<string, string> = {
  garrafa: "garrafa",
  tampa: "tampa",
  rotulo: "rotulo",
  producao: "producao",
  frete_sp: "frete",
  embalagem: "embalagem",
  imposto: "imposto",
  diversos: "diversos",
  frete_internacional: "frete",
};

const pagamentoFornecedorSchema = z.object({
  item_tipo: z.string().optional(),
  fornecedor_id: z.string().optional(),
  valor_pagamento: z.string().optional(),
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

interface SelectedItemInfo {
  id?: string;
  itemEncomendaId?: string | null;
  key: string;
  label: string;
  moeda: "BRL" | "EUR";
  saldo?: number;
  lineItems?: Array<{
    id?: string;
    itemEncomendaId?: string | null;
    saldo: number;
  }>;
  fornecedorSugeridoId?: string | null;
  fornecedorFixo?: { id: string; nome: string } | null;
}

interface PagamentoFornecedorFormProps {
  onSuccess: () => void;
  conta: ContaPagar;
  selectedItem?: SelectedItemInfo;
  selectedItems?: SelectedItemInfo[];
  selectedGroupLabel?: string;
}

export default function PagamentoFornecedorForm({
  onSuccess,
  conta,
  selectedItem,
  selectedItems,
  selectedGroupLabel,
}: PagamentoFornecedorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isOnlus = conta.fornecedor_id === FORNECEDOR_PRODUCAO_ID;
  const isGrouped = Boolean(selectedItems?.length);
  const groupedItems = useMemo(() => selectedItems || [], [selectedItems]);

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
      item_tipo: selectedItem?.key || "",
      valor_pagamento: selectedItem?.saldo ? String(selectedItem.saldo.toFixed(2)) : "",
      fornecedor_id: selectedItem?.fornecedorFixo?.id || selectedItem?.fornecedorSugeridoId || "",
      data_pagamento: new Date().toISOString().split("T")[0],
      forma_pagamento: "transferencia",
    },
  });

  const watchItemTipo = watch("item_tipo");
  const watchFornecedor = watch("fornecedor_id");
  const getGroupedItemId = (item: SelectedItemInfo) => item.id || item.key;
  const [selectedGroupedKeys, setSelectedGroupedKeys] = useState<Set<string>>(
    () => new Set(groupedItems.map((item) => getGroupedItemId(item)))
  );
  const [groupedAmounts, setGroupedAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(groupedItems.map((item) => [getGroupedItemId(item), String((item.saldo || 0).toFixed(2))]))
  );

  const defaultFornecedorId = useMemo(
    () =>
      selectedItem?.fornecedorFixo?.id ||
      selectedItem?.fornecedorSugeridoId ||
      groupedItems.find((item) => item.fornecedorFixo?.id || item.fornecedorSugeridoId)?.fornecedorFixo?.id ||
      groupedItems.find((item) => item.fornecedorFixo?.id || item.fornecedorSugeridoId)?.fornecedorSugeridoId ||
      "",
    [groupedItems, selectedItem]
  );

  useEffect(() => {
    reset({
      item_tipo: selectedItem?.key || "",
      valor_pagamento: selectedItem?.saldo ? String(selectedItem.saldo.toFixed(2)) : "",
      fornecedor_id: defaultFornecedorId,
      data_pagamento: new Date().toISOString().split("T")[0],
      forma_pagamento: "transferencia",
      observacoes: "",
    });
    setSelectedGroupedKeys(new Set(groupedItems.map((item) => getGroupedItemId(item))));
    setGroupedAmounts(
      Object.fromEntries(groupedItems.map((item) => [getGroupedItemId(item), String((item.saldo || 0).toFixed(2))]))
    );
  }, [defaultFornecedorId, groupedItems, reset, selectedItem]);

  // Auto-set fornecedor when item changes
  useEffect(() => {
    if (!isGrouped && selectedItem && !watchFornecedor) {
      const fid = selectedItem.fornecedorFixo?.id || selectedItem.fornecedorSugeridoId;
      if (fid) setValue("fornecedor_id", fid);
    }
  }, [isGrouped, selectedItem, watchFornecedor, setValue]);

  const selectedItemConfig = ITEM_TIPOS.find(i => i.value === watchItemTipo);
  const moeda = isGrouped ? groupedItems[0]?.moeda || "EUR" : selectedItemConfig?.moeda || selectedItem?.moeda || "EUR";
  const groupedTotal = groupedItems.reduce((sum, item) => {
    const itemId = getGroupedItemId(item);
    if (!selectedGroupedKeys.has(itemId)) return sum;
    return sum + (parseFloat(groupedAmounts[itemId] || "0") || 0);
  }, 0);

  const createPaymentBatchId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
          (Number(c) ^ Math.random() * 16 >> Number(c) / 4).toString(16)
        );

  const toPaymentEur = (value: number, paymentCurrency: "BRL" | "EUR") =>
    paymentCurrency === "BRL" ? Math.round(brlToEur(value) * 100) / 100 : Math.round(value * 100) / 100;

  const distributePaymentAcrossLines = (item: SelectedItemInfo | undefined, total: number) => {
    const lines = item?.lineItems?.filter((line) => line.saldo > 0.01) || [];

    if (lines.length === 0) {
      return [{ itemEncomendaId: item?.itemEncomendaId || null, valorPagamento: total }];
    }

    let remaining = Math.round(total * 100) / 100;
    return lines.flatMap((line, index) => {
      if (remaining <= 0) return [];

      const isLast = index === lines.length - 1;
      const value = isLast
        ? remaining
        : Math.min(Math.round(line.saldo * 100) / 100, remaining);
      remaining = Math.round((remaining - value) * 100) / 100;

      return value > 0
        ? [{ itemEncomendaId: line.itemEncomendaId || null, valorPagamento: value }]
        : [];
    });
  };

  const onSubmit = async (data: PagamentoFornecedorFormData) => {
    try {
      setIsLoading(true);
      const exchangeRate = await fetchExchangeRate();
      const paymentBatchId = createPaymentBatchId();

      if (isGrouped) {
        const itemsToPay = groupedItems.filter((item) => selectedGroupedKeys.has(getGroupedItemId(item)));

        if (itemsToPay.length === 0) {
          toast({ title: "Selecione ao menos um item", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const rows = itemsToPay.map((item) => {
          const valor = parseFloat(groupedAmounts[getGroupedItemId(item)] || "0") || 0;
          return { item, valor };
        });

        const invalidAmount = rows.find(({ item, valor }) => valor <= 0 || valor > (item.saldo || 0) + 0.01);
        if (invalidAmount) {
          toast({
            title: "Valor inválido",
            description: `Confira o valor de ${invalidAmount.item.label}.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const groupDescription = selectedGroupLabel || "Pagamento agrupado";
        const observacoes = [
          data.observacoes,
          `${groupDescription}: ${rows.map(({ item }) => item.label).join(", ")}`,
        ].filter(Boolean).join(" | ");

        const { error } = await supabase.from("pagamentos_fornecedor").insert(
          rows.flatMap(({ item, valor }) => {
            const lineRows = distributePaymentAcrossLines(item, valor);

            return lineRows.map(({ itemEncomendaId, valorPagamento }) => ({
              encomenda_id: conta.encomenda_id,
              item_encomenda_id: itemEncomendaId,
              item_tipo: item.key,
              fornecedor_id: data.fornecedor_id || item.fornecedorFixo?.id || item.fornecedorSugeridoId || null,
              destinatario: ITEM_TO_DESTINATARIO[item.key] || null,
              categoria: ITEM_TO_CATEGORIA[item.key] || null,
              moeda: item.moeda,
              valor_pagamento: valorPagamento,
              taxa_cambio: exchangeRate,
              valor_pagamento_eur: toPaymentEur(valorPagamento, item.moeda),
              payment_batch_id: paymentBatchId,
              forma_pagamento: data.forma_pagamento,
              data_pagamento: data.data_pagamento,
              observacoes,
            }));
          })
        );

        if (error) throw error;

        try {
          const valorFormatado = moeda === "BRL"
            ? `R$${groupedTotal.toFixed(2)}`
            : `€${groupedTotal.toFixed(2)}`;
          await sendEmail(
            emailRecipients.lipe,
            `💳 Pagamento agrupado — ${conta.numero_encomenda}`,
            emailTemplates.pagamentoFornecedor(conta.numero_encomenda, "N/A", valorFormatado)
          );
        } catch (emailError) {
          console.error("Erro ao enviar email de notificação:", emailError);
        }

        PushNotifications.pagamentoEfetuado(groupedTotal, conta.fornecedores?.nome).catch(() => { });

        toast({
          title: "Pagamento agrupado lançado com sucesso!",
          description: `${rows.length} item(ns) foram registrados.`,
        });

        reset();
        onSuccess();
        return;
      }

      if (isOnlus && !data.item_tipo) {
        toast({ title: "Selecione o item", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!data.valor_pagamento) {
        toast({ title: "Informe o valor", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const itemTipo = data.item_tipo || "";
      const destinatario = ITEM_TO_DESTINATARIO[itemTipo] || null;
      const categoria = ITEM_TO_CATEGORIA[itemTipo] || null;

      const { error } = await supabase.from("pagamentos_fornecedor").insert(
        distributePaymentAcrossLines(selectedItem, parseFloat(data.valor_pagamento)).map(({ itemEncomendaId, valorPagamento }) => ({
          encomenda_id: conta.encomenda_id,
          item_encomenda_id: itemEncomendaId,
          item_tipo: isOnlus ? itemTipo : null,
          fornecedor_id: data.fornecedor_id || null,
          destinatario: isOnlus ? destinatario : null,
          categoria: isOnlus ? categoria : null,
          moeda: moeda,
          valor_pagamento: valorPagamento,
          taxa_cambio: exchangeRate,
          valor_pagamento_eur: toPaymentEur(valorPagamento, moeda),
          payment_batch_id: paymentBatchId,
          forma_pagamento: data.forma_pagamento,
          data_pagamento: data.data_pagamento,
          observacoes: data.observacoes,
        }))
      );

      if (error) throw error;

      // Enviar notificação por email
      try {
        const valorFormatado = moeda === "BRL"
          ? `R$${parseFloat(data.valor_pagamento).toFixed(2)}`
          : `€${parseFloat(data.valor_pagamento).toFixed(2)}`;
        const itemLabel = ITEM_TIPOS.find(i => i.value === itemTipo)?.label || "";
        await sendEmail(
          emailRecipients.lipe,
          `💳 Pagamento realizado — ${conta.numero_encomenda}${itemLabel ? ` (${itemLabel})` : ""}`,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao lançar pagamento";
      toast({
        title: "Erro ao lançar pagamento",
        description: message,
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
        {isGrouped && (
          <div className="space-y-3 rounded-xl border border-border/40 bg-muted/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">
                  {selectedGroupLabel || "Pagamento agrupado"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Selecione os itens pagos e ajuste os valores parciais.
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total selecionado</span>
                <p className="text-lg font-black text-primary tabular-nums">
                  {moeda === "BRL" ? formatCurrencyBRL(groupedTotal) : formatCurrencyEUR(groupedTotal)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {groupedItems.map((item) => {
                const itemId = getGroupedItemId(item);
                const checked = selectedGroupedKeys.has(itemId);
                const saldo = item.saldo || 0;

                return (
                  <div
                    key={itemId}
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-border/40 bg-popover p-3 sm:grid-cols-[auto_1fr_150px]"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedGroupedKeys((prev) => {
                          const next = new Set(prev);
                          if (value) next.add(itemId);
                          else next.delete(itemId);
                          return next;
                        });
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {item.moeda === "BRL" ? formatCurrencyBRL(saldo) : formatCurrencyEUR(saldo)}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={saldo}
                        disabled={!checked}
                        value={groupedAmounts[itemId] || ""}
                        onChange={(event) =>
                          setGroupedAmounts((prev) => ({
                            ...prev,
                            [itemId]: event.target.value,
                          }))
                        }
                        className="h-9 bg-background text-right font-semibold tabular-nums"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {/* Item Type — só para ONL'US */}
          {isOnlus && !isGrouped && (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                Item
              </Label>
              <Controller
                name="item_tipo"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-popover border-border/40 focus:ring-primary/20 h-11 font-semibold transition-all">
                      <SelectValue placeholder="Selecione o item..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/40">
                      {ITEM_TIPOS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label} ({item.moeda})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.item_tipo && (
                <span className="text-xs font-medium tracking-tight text-red-500">
                  {errors.item_tipo.message}
                </span>
              )}
            </div>
          )}

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Fornecedor
            </Label>
            <Controller
              name="fornecedor_id"
              control={control}
              render={({ field }) => (
                <FornecedorSelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Escolher fornecedor..."
                  suggestedFornecedor={
                    isGrouped && groupedItems[0]?.fornecedorFixo
                      ? groupedItems[0].fornecedorFixo
                      : selectedItem?.fornecedorFixo
                      ? selectedItem.fornecedorFixo
                      : selectedItem?.fornecedorSugeridoId
                        ? { id: selectedItem.fornecedorSugeridoId, nome: "Sugerido" }
                        : undefined
                  }
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {!isGrouped && (
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
              <span className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 transition-colors font-bold">
                {moeda === "BRL" ? "R$" : "€"}
              </span>
            </div>
            {errors.valor_pagamento && (
              <span className="text-xs font-medium tracking-tight text-red-500">
                {errors.valor_pagamento.message}
              </span>
            )}
            </div>
          )}

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
            disabled={isLoading || (isGrouped && groupedTotal <= 0)}
          >
            {isLoading ? "Processando..." : isGrouped ? "Lançar Pagamento Agrupado" : "Lançar Pagamento"}
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
