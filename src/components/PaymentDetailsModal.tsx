import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  isHam = false
}: PaymentDetailsModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // i18n básico
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const dict: Record<string, { pt: string; fr: string }> = {
      "Pagamentos Realizados": { pt: "Pagamentos Realizados", fr: "Paiements effectués" },
      "Encomenda": { pt: "Encomenda", fr: "Commande" },
      "Data": { pt: "Data", fr: "Date" },
      "Método": { pt: "Método", fr: "Méthode" },
      "Valor": { pt: "Valor", fr: "Montant" },
      "Observações": { pt: "Observações", fr: "Observations" },
      "Nenhum pagamento encontrado": { pt: "Nenhum pagamento encontrado", fr: "Aucun paiement trouvé" },
      "Carregando...": { pt: "Carregando...", fr: "Chargement..." },
      "Fechar": { pt: "Fechar", fr: "Fermer" },
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="">
        <DialogHeader>
          <DialogTitle>
            {t("Pagamentos Realizados")} - {t("Encomenda")} #{encomendaNumber}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("Pagamentos Realizados")}
          </DialogDescription>
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
            {/* Tabela desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Data")}</TableHead>
                    <TableHead>{t("Método")}</TableHead>
                    <TableHead>{t("Valor")}</TableHead>
                    <TableHead>{t("Observações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {formatDate(payment.data_pagamento)}
                      </TableCell>
                      <TableCell>{payment.forma_pagamento}</TableCell>
                      <TableCell className="font-semibold text-success">
                        {formatCurrencyEUR(payment.valor_pagamento)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.observacoes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cards mobile */}
            <div className="md:hidden space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-medium">
                        {formatDate(payment.data_pagamento)}
                      </div>
                      <div className="font-semibold text-success">
                        {formatCurrencyEUR(payment.valor_pagamento)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.forma_pagamento}
                    </div>
                    {payment.observacoes && (
                      <div className="text-xs text-muted-foreground">
                        {payment.observacoes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg text-success">
                  {formatCurrencyEUR(payments.reduce((sum, p) => sum + p.valor_pagamento, 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            {t("Fechar")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}