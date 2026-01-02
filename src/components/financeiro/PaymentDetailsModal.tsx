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
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  data_pagamento: string;
  forma_pagamento: string;
  valor_pagamento: number;
  observacoes?: string;
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
    };
    return dict[k]?.[lang] ?? k;
  };

  const fetchPayments = async () => {
    if (!encomendaId) return;

    setLoading(true);
    try {
      const tableName = paymentType === "cliente" ? "pagamentos" : "pagamentos_fornecedor";

      const { data, error } = await supabase
        .from(tableName)
        .select("id, data_pagamento, forma_pagamento, valor_pagamento, observacoes")
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
  }, [isOpen, encomendaId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isHam ? "fr-FR" : "pt-PT");
  };

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
                    <TableHead className="font-bold">{t("Valor")}</TableHead>
                    <TableHead className="font-bold">{t("Observações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      className="hover:bg-muted/30 border-border/40 border-b transition-colors last:border-0"
                    >
                      <TableCell className="text-sm font-medium">
                        {formatDate(payment.data_pagamento)}
                      </TableCell>
                      <TableCell className="text-sm">{payment.forma_pagamento}</TableCell>
                      <TableCell className="text-success text-sm font-bold">
                        {formatCurrencyEUR(payment.valor_pagamento)}
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
                    {formatCurrencyEUR(payments.reduce((sum, p) => sum + p.valor_pagamento, 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Cards mobile - Camada 3 */}
            <div className="space-y-3 md:hidden">
              {payments.map((payment) => (
                <Card key={payment.id} className="bg-popover dark:bg-[#252a36] border-border/40 shadow-sm">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-bold">{formatDate(payment.data_pagamento)}</div>
                      <div className="text-success font-black">
                        {formatCurrencyEUR(payment.valor_pagamento)}
                      </div>
                    </div>
                    <div className="bg-muted/40 w-fit rounded-full px-2 py-0.5 text-xs font-medium">
                      {payment.forma_pagamento}
                    </div>
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
                  {formatCurrencyEUR(payments.reduce((sum, p) => sum + p.valor_pagamento, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
