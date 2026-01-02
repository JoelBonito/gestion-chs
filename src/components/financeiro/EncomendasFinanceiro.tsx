import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Eye, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PagamentoForm } from "@/components/financeiro";
import { FinancialAttachmentButton } from "@/components/financeiro";
import { AttachmentManager } from "@/components/shared";
import { OrderItemsView } from "@/components/shared";
import { useLocale } from "@/contexts/LocaleContext";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { PaymentDetailsModal } from "@/components/financeiro";
import { useEncomendasFinanceiroTranslation } from "@/hooks/useEncomendasFinanceiroTranslation";

interface EncomendaFinanceira {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  valor_frete: number;
  total_pagamentos: number;
  data_producao_estimada?: string | null;
}

interface EncomendasFinanceiroProps {
  onRefreshNeeded?: () => void;
  showCompleted?: boolean;
}

export default function EncomendasFinanceiro({
  onRefreshNeeded,
  showCompleted = false,
}: EncomendasFinanceiroProps) {
  const [encomendas, setEncomendas] = useState<EncomendaFinanceira[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEncomenda, setSelectedEncomenda] = useState<EncomendaFinanceira | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localShowCompleted, setLocalShowCompleted] = useState(showCompleted);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPaymentEncomenda, setSelectedPaymentEncomenda] =
    useState<EncomendaFinanceira | null>(null);
  const { toast } = useToast();
  const { tr, isHam } = useEncomendasFinanceiroTranslation();

  const fetchEncomendas = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          id,
          numero_encomenda,
          etiqueta,
          valor_total,
          valor_pago,
          saldo_devedor,
          valor_frete,
          data_producao_estimada,
          clientes!inner(nome),
          pagamentos(valor_pagamento)
        `
        )
        // quando showCompleted = false, mostrar apenas saldo > 0
        .gte("saldo_devedor", localShowCompleted ? 0 : 0.01)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas: EncomendaFinanceira[] = (data || []).map((e) => ({
        id: e.id,
        numero_encomenda: e.numero_encomenda,
        etiqueta: e.etiqueta ?? null,
        cliente_nome: e.clientes?.nome ?? "",
        valor_total: Number(e.valor_total || 0),
        valor_pago: Number(e.valor_pago || 0),
        saldo_devedor: Number(e.saldo_devedor || 0),
        valor_frete: Number(e.valor_frete || 0),
        total_pagamentos: Array.isArray(e.pagamentos) ? e.pagamentos.length : 0,
        data_producao_estimada: e.data_producao_estimada ?? null,
      }));

      setEncomendas(encomendasFormatadas);
    } catch (err) {
      console.error("Erro ao carregar encomendas financeiras:", err);
      toast({
        title: "Erro ao carregar encomendas",
        description: err?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localShowCompleted]);

  const handlePagamentoSuccess = () => {
    fetchEncomendas();
    setShowPagamentoForm(false);
    setSelectedEncomenda(null);
    onRefreshNeeded?.();
  };

  const handleViewDetails = (encomenda: EncomendaFinanceira) => {
    setSelectedEncomenda(encomenda);
    setShowDetails(true);
  };

  const handleAttachmentChange = () => {
    fetchEncomendas();
    onRefreshNeeded?.();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(isHam ? "fr-FR" : "pt-PT");
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{tr("Carregando encomendas...")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card bg-card dark:bg-[#1c202a] border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="text-warning h-5 w-5" />
                {tr("Vendas - Clientes")}
              </CardTitle>
              <CardDescription>{tr("Encomendas com saldo devedor de clientes")}</CardDescription>
            </div>
            <div className="bg-muted/30 border-border/30 group flex items-center space-x-3 rounded-xl border px-3 py-1.5 shadow-inner">
              <Switch
                id="show-completed-receivable"
                checked={localShowCompleted}
                onCheckedChange={setLocalShowCompleted}
              />
              <Label
                htmlFor="show-completed-receivable"
                className="cursor-pointer text-xs font-semibold tracking-wider uppercase"
              >
                {tr("Mostrar Concluídos")}
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
                  <TableHead>{tr("Nº Encomenda")}</TableHead>
                  <TableHead>{tr("Cliente")}</TableHead>
                  <TableHead>{tr("Data Produção")}</TableHead>
                  <TableHead>{tr("Total")}</TableHead>
                  <TableHead>{tr("Recebido")}</TableHead>
                  <TableHead>{tr("Saldo")}</TableHead>
                  <TableHead>{tr("Pagamentos")}</TableHead>
                  <TableHead>{tr("Ações")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendas.map((encomenda) => (
                  <TableRow
                    key={encomenda.id}
                    className="bg-popover hover:bg-muted/30 border-border group cursor-pointer border-b transition-colors last:border-0 dark:border-white/5"
                    onClick={() => handleViewDetails(encomenda)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="group-hover:text-primary transition-colors">
                          {encomenda.numero_encomenda}
                        </span>
                        {encomenda.etiqueta && (
                          <Badge variant="info" className="mt-0.5">
                            {encomenda.etiqueta}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{encomenda.cliente_nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(encomenda.data_producao_estimada)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrencyEUR(encomenda.valor_total)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatCurrencyEUR(encomenda.valor_pago)}
                    </TableCell>
                    <TableCell className="text-warning font-semibold">
                      {formatCurrencyEUR(encomenda.saldo_devedor)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {encomenda.total_pagamentos > 0 ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary h-auto p-0 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPaymentEncomenda(encomenda);
                            setShowPaymentDetails(true);
                          }}
                        >
                          {encomenda.total_pagamentos} {tr("pag.")}
                        </Button>
                      ) : (
                        tr("Nenhum")
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(encomenda);
                          }}
                          title={tr("Visualizar detalhes")}
                          type="button"
                          className="hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isHam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEncomenda(encomenda);
                              setShowPagamentoForm(true);
                            }}
                            title={tr("Registrar pagamento")}
                            type="button"
                            className="hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                        <FinancialAttachmentButton
                          entityType="receivable"
                          entityId={encomenda.id}
                          title={tr("Anexar Comprovante")}
                          onChanged={handleAttachmentChange}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {encomendas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      {tr("Nenhuma conta a receber encontrada")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Lista em cartões no mobile/tablet */}
          <div className="space-y-3 xl:hidden">
            {encomendas.length === 0 && (
              <Card className="border-dashed shadow-none">
                <CardContent className="text-muted-foreground p-6 text-center">
                  {tr("Nenhuma conta a receber encontrada")}
                </CardContent>
              </Card>
            )}
            {encomendas.map((e) => (
              <Card
                key={e.id}
                className="bg-popover border-border/50 cursor-pointer overflow-hidden transition-all active:scale-[0.98]"
                onClick={() => handleViewDetails(e)}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">#{e.numero_encomenda}</div>
                      {e.etiqueta && (
                        <Badge variant="info" className="mt-0.5">
                          {e.etiqueta}
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground shrink-0 text-sm">
                      {formatDate(e.data_producao_estimada)}
                    </div>
                  </div>
                  <div className="truncate text-sm">{e.cliente_nome}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">{tr("Total")}</div>
                      <div className="font-semibold">{formatCurrencyEUR(e.valor_total)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{tr("Recebido")}</div>
                      <div className="text-success">{formatCurrencyEUR(e.valor_pago)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{tr("Saldo")}</div>
                      <div className="text-warning font-semibold">
                        {formatCurrencyEUR(e.saldo_devedor)}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {e.total_pagamentos > 0 ? (
                      <button
                        className="text-primary cursor-pointer underline"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedPaymentEncomenda(e);
                          setShowPaymentDetails(true);
                        }}
                      >
                        {e.total_pagamentos} {tr("pag.")}
                      </button>
                    ) : (
                      tr("Nenhum")
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
                      onClick={() => handleViewDetails(e)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> {tr("Visualizar detalhes")}
                    </Button>
                    {!isHam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-emerald-200/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 sm:w-auto dark:border-emerald-800/30 dark:text-emerald-400"
                        onClick={() => {
                          setSelectedEncomenda(e);
                          setShowPagamentoForm(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> {tr("Registrar pagamento")}
                      </Button>
                    )}
                    <FinancialAttachmentButton
                      entityType="receivable"
                      entityId={e.id}
                      title={tr("Anexar Comprovante")}
                      onChanged={handleAttachmentChange}
                      showLabel={true}
                      className="w-full border border-purple-200/30 bg-purple-500/5 text-purple-600 hover:bg-purple-500/10 sm:w-auto dark:border-purple-800/30 dark:text-purple-400"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Registrar Pagamento — NÃO renderiza para ham */}
      {!isHam && selectedEncomenda && (
        <Dialog open={showPagamentoForm} onOpenChange={setShowPagamentoForm}>
          <DialogContent
            className="bg-card border-border max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto"
            aria-describedby=""
          >
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Plus className="text-primary h-5 w-5" />
                {tr("Registrar Pagamento")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {tr("Associe um novo pagamento à encomenda selecionada.")}
              </DialogDescription>
            </DialogHeader>
            <PagamentoForm onSuccess={handlePagamentoSuccess} encomendas={[selectedEncomenda]} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Detalhes + Anexos */}
      {selectedEncomenda && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent
            className="bg-card border-border max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto"
            aria-describedby=""
          >
            <DialogHeader className="mb-4 border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Eye className="text-primary h-5 w-5" />
                {tr("Detalhes da Conta a Receber")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {tr("Confira todas as informações financeiras desta venda.")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Detalhes da encomenda - Camada 3 (Destaque sobre Camada 2) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Encomenda:")}
                  </span>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    #{selectedEncomenda.numero_encomenda}
                    {selectedEncomenda.etiqueta && (
                      <Badge variant="info">{selectedEncomenda.etiqueta}</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Cliente:")}
                  </span>
                  <p className="text-sm font-semibold">{selectedEncomenda.cliente_nome}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Data Produção:")}
                  </span>
                  <p className="text-sm font-semibold italic">
                    {formatDate(selectedEncomenda.data_producao_estimada)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Valor Itens:")}
                  </span>
                  <p className="text-sm font-bold">
                    €
                    {(selectedEncomenda.valor_total - selectedEncomenda.valor_frete).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Valor Frete:")}
                  </span>
                  <p className="text-sm font-bold">
                    {formatCurrencyEUR(selectedEncomenda.valor_frete)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Total:")}
                  </span>
                  <p className="text-primary text-sm font-black">
                    {formatCurrencyEUR(selectedEncomenda.valor_total)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Recebido:")}
                  </span>
                  <p className="text-success text-sm font-bold">
                    {formatCurrencyEUR(selectedEncomenda.valor_pago)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Saldo:")}
                  </span>
                  <p className="text-warning text-sm font-black">
                    {formatCurrencyEUR(selectedEncomenda.saldo_devedor)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    {tr("Pagamentos:")}
                  </span>
                  <p className="text-sm font-semibold">{selectedEncomenda.total_pagamentos}</p>
                </div>
              </div>

              {/* Itens da encomenda - Camada Interna (Automático pelo Card do componente) */}
              <OrderItemsView encomendaId={selectedEncomenda.id} />

              {/* Anexos - Camada 3 (Destaque) */}
              <div className="border-border/40 border-t pt-6">
                <AttachmentManager
                  entityType="receivable"
                  entityId={selectedEncomenda.id}
                  title={tr("Comprovantes de Recebimento")}
                  onChanged={handleAttachmentChange}
                  useTertiaryLayer={true}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de detalhes dos pagamentos */}
      {selectedPaymentEncomenda && (
        <PaymentDetailsModal
          isOpen={showPaymentDetails}
          onClose={() => {
            setShowPaymentDetails(false);
            setSelectedPaymentEncomenda(null);
          }}
          encomendaId={selectedPaymentEncomenda.id}
          encomendaNumber={selectedPaymentEncomenda.numero_encomenda}
          paymentType="cliente"
          isHam={isHam}
        />
      )}
    </div>
  );
}
