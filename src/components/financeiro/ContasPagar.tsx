import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Receipt, DollarSign, Plus, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { EncomendaView } from "@/components/encomendas";
import { PagamentoFornecedorForm } from "@/components/financeiro";
import { AttachmentManager } from "@/components/shared";
import { IconWithBadge } from "@/components/ui/icon-with-badge";
import { PaymentDetailsModal } from "@/components/financeiro";
import { OrderItemsView } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useContasPagarTranslation } from "@/hooks/useContasPagarTranslation";

interface ContaPagar {
  id: string;
  numero_encomenda: string;
  fornecedor_id: string;
  fornecedores: { nome: string } | null;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  data_criacao: string;
  status: string;
  etiqueta: string;
  encomenda_id: string;
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const [paymentCounts, setPaymentCounts] = useState<Record<string, number>>({});
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPaymentConta, setSelectedPaymentConta] = useState<ContaPagar | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  const { t, isHam, isFelipe } = useContasPagarTranslation();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    };
    getUser();
  }, []);

  const fetchContas = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("encomendas")
        .select(
          `
          id,
          numero_encomenda,
          fornecedor_id,
          fornecedores ( nome ),
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          data_criacao,
          status,
          etiqueta
        `
        )
        .gte("saldo_devedor_fornecedor", showCompleted ? 0 : 0.01);

      // Filtro para Felipe - apenas fornecedores específicos
      if (isFelipe) {
        query = query.in("fornecedor_id", [
          "f0920a27-752c-4483-ba02-e7f32beceef6",
          "b8f995d2-47dc-4c8f-9779-ce21431f5244",
        ]);
      }

      const { data, error } = await query.order("data_criacao", { ascending: false });

      if (error) throw error;

      const contasPagar: ContaPagar[] = (data || []).map((item) => {
        const row = item as unknown as ContaPagar;
        return {
          ...row,
          encomenda_id: row.id,
        };
      });
      setContas(contasPagar);
    } catch (error) {
      console.error("Erro ao carregar contas a pagar:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [showCompleted, isFelipe, toast]);

  useEffect(() => {
    fetchContas();
  }, [showCompleted, fetchContas]);

  const handlePaymentSuccess = () => {
    fetchContas();
    toast({
      title: "Sucesso",
      description: "Pagamento registrado com sucesso",
    });
  };

  const handleViewDetails = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setShowDetails(true);
  };

  const handleAttachmentChange = () => {
    fetchContas();
    loadAttachmentCounts();
    loadPaymentCounts();
  };

  const loadAttachmentCounts = useCallback(async () => {
    if (contas.length === 0) return;

    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        contas.map(async (conta) => {
          const { count, error } = await supabase
            .from("attachments")
            .select("*", { count: "exact", head: true })
            .eq("entity_type", "payable")
            .eq("entity_id", conta.id);

          if (!error) {
            counts[conta.id] = count || 0;
          }
        })
      );

      setAttachmentCounts(counts);
    } catch (error) {
      console.error("Error loading attachment counts:", error);
    }
  }, [contas]);

  const loadPaymentCounts = useCallback(async () => {
    if (contas.length === 0) return;

    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        contas.map(async (conta) => {
          const { count, error } = await supabase
            .from("pagamentos_fornecedor")
            .select("*", { count: "exact", head: true })
            .eq("encomenda_id", conta.id);

          if (!error) {
            counts[conta.id] = count || 0;
          }
        })
      );

      setPaymentCounts(counts);
    } catch (error) {
      console.error("Error loading payment counts:", error);
    }
  }, [contas]);

  useEffect(() => {
    if (contas.length > 0) {
      loadAttachmentCounts();
      loadPaymentCounts();
    }
  }, [contas, loadAttachmentCounts, loadPaymentCounts]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">{t("Carregando...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (contas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            {t("Nenhuma conta a pagar encontrada")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-card bg-card dark:bg-[#1c202a] border-border/50">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="text-warning h-5 w-5" />
                {t("Compras - Fornecedores")}
              </CardTitle>
              <CardDescription>
                {t("Encomendas com saldo devedor para fornecedores")}
              </CardDescription>
            </div>
            <div className="bg-muted/30 border-border/30 group flex items-center space-x-3 rounded-xl border px-3 py-1.5 shadow-inner">
              <Switch
                id="show-completed-payable"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label
                htmlFor="show-completed-payable"
                className="cursor-pointer text-xs font-semibold tracking-wider uppercase"
              >
                {t("Mostrar Concluídos")}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {/* Tabela apenas no desktop */}
          <div className="border-border/40 bg-popover dark:bg-[#1c202a] hidden overflow-hidden overflow-x-auto rounded-xl border shadow-sm xl:block">
            <Table>
              <TableHeader className="bg-popover border-border/40 border-b">
                <TableRow className="border-b-0 transition-none hover:bg-transparent">
                  <TableHead>{t("Pedido")}</TableHead>
                  <TableHead>{t("Fornecedor")}</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>{t("Valor Total")}</TableHead>
                  <TableHead>{t("Valor Pago")}</TableHead>
                  <TableHead>{t("Saldo")}</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>{t("Ações")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {contas.map((conta) => (
                  <TableRow
                    key={conta.id}
                    className="bg-popover hover:bg-muted/30 border-border group cursor-pointer border-b transition-colors last:border-0 dark:border-white/5"
                    onClick={() => handleViewDetails(conta)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="group-hover:text-primary transition-colors">
                          {conta.numero_encomenda}
                        </span>
                        <Badge variant="info" className="mt-0.5">
                          {conta.etiqueta || "Nenhum"}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>{conta.fornecedores?.nome || "N/A"}</TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(conta.data_criacao).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="font-semibold">
                      {formatCurrencyEUR(conta.valor_total_custo)}
                    </TableCell>

                    <TableCell className="text-success">
                      {formatCurrencyEUR(conta.valor_pago_fornecedor)}
                    </TableCell>

                    <TableCell className="text-warning font-semibold">
                      {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {paymentCounts[conta.id] > 0 ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary h-auto p-0 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPaymentConta(conta);
                            setShowPaymentDetails(true);
                          }}
                        >
                          {paymentCounts[conta.id]} pag.
                        </Button>
                      ) : (
                        "Nenhum"
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(conta);
                          }}
                          title={t("Ver Detalhes")}
                          type="button"
                          className="hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {!isFelipe && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("Registrar Pagamento")}
                            type="button"
                            className="hover:text-primary hover:bg-primary/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConta(conta);
                              // Aqui precisamos de uma forma de abrir o modal de pagamento
                              // Como estava dentro de um DialogTrigger, vamos mudar a lógica para usar estado
                              setShowPaymentForm(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}

                        <div onClick={(e) => e.stopPropagation()}>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title={t("Anexar Comprovante")}
                                type="button"
                              >
                                <IconWithBadge
                                  icon={<Paperclip className="h-4 w-4" />}
                                  count={attachmentCounts[conta.id] || 0}
                                />
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              className="bg-background border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
                              aria-describedby=""
                            >
                              <DialogHeader className="mb-4 border-b pb-4">
                                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                  <Paperclip className="text-primary h-5 w-5" />
                                  {t("Anexar Comprovante")}
                                </DialogTitle>
                              </DialogHeader>
                              <AttachmentManager
                                entityType="payable"
                                entityId={conta.id}
                                title={t("Anexar Comprovante")}
                                onChanged={handleAttachmentChange}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {contas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      {t("Nenhuma conta a pagar encontrada")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Lista em cartões no mobile/tablet */}
          <div className="space-y-3 xl:hidden">
            {contas.length === 0 && (
              <Card className="border-dashed shadow-none">
                <CardContent className="text-muted-foreground p-6 text-center">
                  {t("Nenhuma conta a pagar encontrada")}
                </CardContent>
              </Card>
            )}
            {contas.map((conta) => (
              <Card
                key={conta.id}
                className="bg-popover border-border/50 cursor-pointer overflow-hidden transition-all active:scale-[0.98]"
                onClick={() => handleViewDetails(conta)}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        #{conta.numero_encomenda}
                      </div>
                      <Badge variant="info" className="mt-0.5">
                        {conta.etiqueta || "Nenhum"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground shrink-0 text-sm">
                      {new Date(conta.data_criacao).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="truncate text-sm">{conta.fornecedores?.nome || "N/A"}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">{t("Valor Total")}</div>
                      <div className="font-semibold">
                        {formatCurrencyEUR(conta.valor_total_custo)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t("Valor Pago")}</div>
                      <div className="text-success">
                        {formatCurrencyEUR(conta.valor_pago_fornecedor)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t("Saldo")}</div>
                      <div className="text-warning font-semibold">
                        {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {paymentCounts[conta.id] > 0 ? (
                      <button
                        className="text-primary cursor-pointer underline"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedPaymentConta(conta);
                          setShowPaymentDetails(true);
                        }}
                      >
                        {paymentCounts[conta.id]} pag.
                      </button>
                    ) : (
                      "Nenhum"
                    )}
                  </div>
                  <div
                    className="flex flex-col gap-2 pt-1 sm:flex-row"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border border-sky-200/30 bg-sky-500/5 text-sky-600 hover:bg-sky-500/10 sm:w-auto dark:border-sky-800/30 dark:text-sky-400"
                      onClick={() => handleViewDetails(conta)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> {t("Ver Detalhes")}
                    </Button>
                    {!isFelipe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-emerald-200/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 sm:w-auto dark:border-emerald-800/30 dark:text-emerald-400"
                        onClick={() => {
                          setSelectedConta(conta);
                          setShowPaymentForm(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> {t("Registrar Pagamento")}
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-purple-200/30 bg-purple-500/5 text-purple-600 hover:bg-purple-500/10 sm:w-auto dark:border-purple-800/30 dark:text-purple-400"
                          title={t("Anexar Comprovante")}
                        >
                          <IconWithBadge
                            icon={<Paperclip className="h-4 w-4" />}
                            count={attachmentCounts[conta.id] || 0}
                          />
                          <span className="ml-2">Anexos</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="bg-background border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
                        aria-describedby={undefined}
                      >
                        <DialogHeader className="mb-4 border-b pb-4">
                          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Paperclip className="text-primary h-5 w-5" />
                            {t("Anexar Comprovante")}
                          </DialogTitle>
                        </DialogHeader>
                        <AttachmentManager
                          entityType="payable"
                          entityId={conta.id}
                          title={t("Anexar Comprovante")}
                          onChanged={handleAttachmentChange}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Registrar Pagamento Fornecedor */}
      {!isFelipe && selectedConta && (
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent
            className="bg-card border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
            aria-describedby=""
          >
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Plus className="text-primary h-5 w-5" />
                {t("Registrar Pagamento")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Registre um novo pagamento para o fornecedor deste pedido.
              </DialogDescription>
            </DialogHeader>
            <PagamentoFornecedorForm
              conta={{ ...selectedConta, encomenda_id: selectedConta.id }}
              onSuccess={() => {
                handlePaymentSuccess();
                setShowPaymentForm(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Detalhes + Anexos */}
      {selectedConta && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent
            className="bg-card border-border max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto"
            aria-describedby=""
          >
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Eye className="text-primary h-5 w-5" />
                {t("Detalhes da Conta a Pagar")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Confira todas as informações financeiras desta compra.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Detalhes da conta - Camada 3 (Destaque sobre Camada 2) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Pedido")}:
                  </span>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    #{selectedConta.numero_encomenda}
                    {selectedConta.etiqueta && (
                      <Badge variant="info">{selectedConta.etiqueta}</Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Fornecedor")}:
                  </span>
                  <p className="text-sm font-semibold">
                    {selectedConta.fornecedores?.nome || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Data")}:
                  </span>
                  <p className="text-sm font-semibold italic">
                    {new Date(selectedConta.data_criacao).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Status")}:
                  </span>
                  <div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary bg-primary/5"
                    >
                      {selectedConta.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Valor Total")}:
                  </span>
                  <p className="text-sm font-bold">
                    {formatCurrencyEUR(selectedConta.valor_total_custo)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Valor Pago")}:
                  </span>
                  <p className="text-success text-sm font-bold">
                    {formatCurrencyEUR(selectedConta.valor_pago_fornecedor)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {t("Saldo")}:
                  </span>
                  <p className="text-warning text-sm font-black">
                    {formatCurrencyEUR(selectedConta.saldo_devedor_fornecedor)}
                  </p>
                </div>
              </div>

              {/* Itens da Encomenda */}
              <div className="pt-2">
                <OrderItemsView encomendaId={selectedConta.id} showCostPrices={true} />
              </div>

              {/* Anexos - Camada 3 (Destaque) */}
              <div className="border-border/40 border-t pt-6">
                <AttachmentManager
                  entityType="payable"
                  entityId={selectedConta.id}
                  title={t("Comprovantes e Anexos")}
                  onChanged={handleAttachmentChange}
                  useTertiaryLayer={true}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de detalhes dos pagamentos */}
      {selectedPaymentConta && (
        <PaymentDetailsModal
          isOpen={showPaymentDetails}
          onClose={() => {
            setShowPaymentDetails(false);
            setSelectedPaymentConta(null);
          }}
          encomendaId={selectedPaymentConta.id}
          encomendaNumber={selectedPaymentConta.numero_encomenda}
          paymentType="fornecedor"
          isHam={isHam}
        />
      )}
    </div>
  );
}
