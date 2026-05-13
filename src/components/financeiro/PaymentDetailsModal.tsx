import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyBRL, formatCurrencyEUR } from "@/lib/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  data_pagamento: string;
  forma_pagamento: string;
  valor_pagamento: number;
  observacoes?: string;
  destinatario?: string | null;
  categoria?: string | null;
  item_tipo?: string | null;
  moeda?: string | null;
  payment_batch_id?: string | null;
  taxa_cambio?: number | null;
  valor_pagamento_eur?: number | null;
  fornecedores?: { nome: string } | null;
}

interface PaymentSummary extends Payment {
  technicalRows: Payment[];
  itemLabels: string[];
  originalTotals: Record<string, number>;
  totalEur: number;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  encomendaId: string;
  encomendaNumber: string;
  paymentType: "cliente" | "fornecedor";
  isHam?: boolean;
}

export function PaymentDetailsModal({
  isOpen,
  onClose,
  encomendaId,
  encomendaNumber,
  paymentType,
  isHam = false,
}: PaymentDetailsModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // i18n básico
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const dict: Record<string, { pt: string; fr: string }> = {
      "Pagamentos Realizados": { pt: "Pagamentos Realizados", fr: "Paiements effectués" },
      Encomenda: { pt: "Encomenda", fr: "Commande" },
      Data: { pt: "Data", fr: "Date" },
      Método: { pt: "Método", fr: "Méthode" },
      Valor: { pt: "Valor", fr: "Montant" },
      Observações: { pt: "Observações", fr: "Observations" },
      "Nenhum pagamento encontrado": {
        pt: "Nenhum pagamento encontrado",
        fr: "Aucun paiement trouvé",
      },
      "Carregando...": { pt: "Carregando...", fr: "Chargement..." },
      Fechar: { pt: "Fechar", fr: "Fermer" },
      "Total Acumulado:": { pt: "Total Acumulado:", fr: "Total cumulé :" },
      "Total:": { pt: "Total:", fr: "Total :" },
      "Destinatário": { pt: "Destinatário", fr: "Destinataire" },
      "Categoria": { pt: "Categoria", fr: "Catégorie" },
      "Item": { pt: "Item", fr: "Article" },
      "Fornecedor": { pt: "Fornecedor", fr: "Fournisseur" },
      "Moeda": { pt: "Moeda", fr: "Devise" },
    };
    return dict[k]?.[lang] ?? k;
  };

  const fetchPayments = async () => {
    if (!encomendaId) return;

    setLoading(true);
    try {
      const tableName = paymentType === "cliente" ? "pagamentos" : "pagamentos_fornecedor";

      const selectFields = paymentType === "fornecedor"
        ? "id, data_pagamento, forma_pagamento, valor_pagamento, valor_pagamento_eur, taxa_cambio, payment_batch_id, observacoes, destinatario, categoria, item_tipo, moeda, fornecedores ( nome )"
        : "id, data_pagamento, forma_pagamento, valor_pagamento, observacoes";

      const { data, error } = await supabase
        .from(tableName)
        .select(selectFields)
        .eq("encomenda_id", encomendaId)
        .order("data_pagamento", { ascending: false });

      if (error) throw error;

      setPayments(data || []);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && encomendaId) {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, encomendaId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isHam ? "fr-FR" : "pt-PT");
  };

  const paymentSummaries: PaymentSummary[] = paymentType === "fornecedor"
    ? Object.values(
        payments.reduce<Record<string, PaymentSummary>>((acc, payment) => {
          const batchKey = payment.payment_batch_id || payment.id;
          const currency = payment.moeda || "EUR";
          const valueEur = payment.valor_pagamento_eur ?? payment.valor_pagamento;

          if (!acc[batchKey]) {
            acc[batchKey] = {
              ...payment,
              valor_pagamento: 0,
              valor_pagamento_eur: 0,
              technicalRows: [],
              itemLabels: [],
              originalTotals: {},
              totalEur: 0,
            };
          }

          const summary = acc[batchKey];
          summary.technicalRows.push(payment);
          summary.valor_pagamento += payment.valor_pagamento;
          summary.valor_pagamento_eur = (summary.valor_pagamento_eur || 0) + valueEur;
          summary.totalEur += valueEur;
          summary.originalTotals[currency] = (summary.originalTotals[currency] || 0) + payment.valor_pagamento;

          const itemLabel = payment.item_tipo?.replace("_", " ");
          if (itemLabel && !summary.itemLabels.includes(itemLabel)) {
            summary.itemLabels.push(itemLabel);
          }

          return acc;
        }, {})
      )
    : payments.map((payment) => ({
        ...payment,
        technicalRows: [payment],
        itemLabels: [],
        originalTotals: { EUR: payment.valor_pagamento },
        totalEur: payment.valor_pagamento,
      }));

  const formatOriginalTotals = (payment: PaymentSummary) =>
    Object.entries(payment.originalTotals)
      .map(([currency, value]) =>
        currency === "BRL" ? formatCurrencyBRL(value) : formatCurrencyEUR(value)
      )
      .join(" + ");

  const totalEur = paymentSummaries.reduce((sum, payment) => sum + payment.totalEur, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto"
        aria-describedby=""
      >
        <DialogHeader className="mb-4 border-b pb-4">
          <DialogTitle className="text-xl font-bold">
            {t("Pagamentos Realizados")} - {t("Encomenda")} #{encomendaNumber}
          </DialogTitle>
          <DialogDescription className="sr-only">{t("Pagamentos Realizados")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t("Carregando...")}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t("Nenhum pagamento encontrado")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabela desktop - Camada 4 */}
            <div className="border-border/40 bg-accent dark:bg-[#2d3342] hidden overflow-hidden rounded-xl border shadow-sm md:block">
              <Table>
                <TableHeader className="bg-accent dark:bg-[#2d3342] border-border/40 border-b">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">{t("Data")}</TableHead>
                    <TableHead className="font-bold">{t("Método")}</TableHead>
                    {paymentType === "fornecedor" && (
                      <>
                        <TableHead className="font-bold">{t("Item")}</TableHead>
                        <TableHead className="font-bold">{t("Fornecedor")}</TableHead>
                        <TableHead className="font-bold">{t("Moeda")}</TableHead>
                      </>
                    )}
                    <TableHead className="font-bold">{t("Valor")}</TableHead>
                    <TableHead className="font-bold">{t("Observações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSummaries.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="hover:bg-muted/30 border-border/40 border-b transition-colors last:border-0"
                    >
                      <TableCell className="text-sm font-medium">
                        {formatDate(payment.data_pagamento)}
                      </TableCell>
                      <TableCell className="text-sm">{payment.forma_pagamento}</TableCell>
                      {paymentType === "fornecedor" && (
                        <>
                          <TableCell className="text-sm">
                            {payment.itemLabels.length > 0 ? (
                              <span className="bg-muted/40 w-fit rounded-full px-2 py-0.5 text-[10px] font-medium capitalize">
                                {payment.itemLabels.join(", ")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.fornecedores?.nome ? (
                              <span className="font-medium">{payment.fornecedores.nome}</span>
                            ) : payment.destinatario ? (
                              <span className="font-medium capitalize">{payment.destinatario}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className={payment.originalTotals.BRL ? "text-amber-500 font-bold" : "text-primary font-bold"}>
                              {Object.keys(payment.originalTotals).join(" + ")}
                            </span>
                            {payment.technicalRows.length > 1 && (
                              <span className="ml-1 text-[10px] text-muted-foreground">
                                ({payment.technicalRows.length} linhas)
                              </span>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-success text-sm font-bold">
                        <div className="flex flex-col">
                          <span>{formatOriginalTotals(payment)}</span>
                          {paymentType === "fornecedor" && payment.originalTotals.BRL && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatCurrencyEUR(payment.totalEur)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm italic">
                        {payment.observacoes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Total Desk */}
              <div className="border-border/40 bg-muted/20 border-t p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Total Acumulado:")}
                  </span>
                  <span className="text-success text-xl font-black">
                    {formatCurrencyEUR(totalEur)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cards mobile - Camada 3 */}
            <div className="space-y-3 md:hidden">
              {paymentSummaries.map((payment) => (
                <Card key={payment.id} className="bg-popover dark:bg-[#252a36] border-border/40 shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-bold">{formatDate(payment.data_pagamento)}</div>
                      <div className="text-success font-black">
                        {formatOriginalTotals(payment)}
                      </div>
                    </div>
                    <div className="bg-muted/40 w-fit rounded-full px-2 py-0.5 text-xs font-medium">
                      {payment.forma_pagamento}
                    </div>
                    {paymentType === "fornecedor" && (
                      <div className="flex flex-wrap gap-1.5">
                        {payment.itemLabels.length > 0 && (
                          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                            {payment.itemLabels.join(", ")}
                          </span>
                        )}
                        {payment.fornecedores?.nome && (
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit rounded-full px-2 py-0.5 text-xs font-medium">
                            {payment.fornecedores.nome}
                          </span>
                        )}
                        {Object.keys(payment.originalTotals).length > 0 && (
                          <span className={(payment.originalTotals.BRL ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400") + " w-fit rounded-full px-2 py-0.5 text-xs font-bold"}>
                            {Object.keys(payment.originalTotals).join(" + ")}
                          </span>
                        )}
                        {payment.technicalRows.length > 1 && (
                          <span className="bg-muted/50 text-muted-foreground w-fit rounded-full px-2 py-0.5 text-xs font-medium">
                            {payment.technicalRows.length} linhas técnicas
                          </span>
                        )}
                      </div>
                    )}
                    {paymentType === "fornecedor" && payment.originalTotals.BRL && (
                      <div className="text-muted-foreground text-xs">
                        Equivalente: {formatCurrencyEUR(payment.totalEur)}
                      </div>
                    )}
                    {payment.observacoes && (
                      <div className="text-muted-foreground bg-muted/10 border-primary/20 rounded border-l-2 p-2 text-xs">
                        {payment.observacoes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total Mobile */}
            <div className="border-border/40 border-t px-2 pt-4 md:hidden">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  {t("Total:")}
                </span>
                <span className="text-success text-xl font-black">
                  {formatCurrencyEUR(totalEur)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
