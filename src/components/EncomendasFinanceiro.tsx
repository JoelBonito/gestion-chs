import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Eye, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoForm from "@/components/PagamentoForm";
import { FinancialAttachmentButton } from "@/components/FinancialAttachmentButton";
import { AttachmentManager } from "@/components/AttachmentManager";
import { OrderItemsView } from "@/components/OrderItemsView";
import { useLocale } from "@/contexts/LocaleContext";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { PaymentDetailsModal } from "@/components/PaymentDetailsModal";

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
  const [selectedPaymentEncomenda, setSelectedPaymentEncomenda] = useState<EncomendaFinanceira | null>(null);
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  // Usuário ham@admin.com utiliza FR e não pode registrar pagamento
  const isHam = isRestrictedFR;

  // --- i18n helper ---
  type Lang = "pt" | "fr";
  const lang: Lang = isHam ? "fr" : "pt";
  const dict: Record<string, { pt: string; fr: string }> = {
    // Títulos / descrições
    "Vendas - Clientes": { pt: "Vendas - Clientes", fr: "Ventes - Clients" },
    "Encomendas com saldo devedor de clientes": {
      pt: "Encomendas com saldo devedor de clientes",
      fr: "Commandes avec solde débiteur des clients",
    },
    "Mostrar Concluídos": { pt: "Mostrar Concluídos", fr: "Afficher terminés" },

    // Tabela (headers)
    "Nº Encomenda": { pt: "Nº Encomenda", fr: "N° de commande" },
    "Cliente": { pt: "Cliente", fr: "Client" },
    "Data Produção": { pt: "Data Produção", fr: "Date de production" },
    "Total": { pt: "Total", fr: "Total" },
    "Recebido": { pt: "Recebido", fr: "Reçu" },
    "Saldo": { pt: "Saldo", fr: "Solde" },
    "Pagamentos": { pt: "Pagamentos", fr: "Paiements" },
    "Ações": { pt: "Ações", fr: "Actions" },

    // Estados/mensagens
    "Carregando encomendas...": { pt: "Carregando encomendas...", fr: "Chargement des commandes..." },
    "Nenhuma conta a receber encontrada": {
      pt: "Nenhuma conta a receber encontrada",
      fr: "Aucun compte à recevoir trouvé",
    },
    "pag.": { pt: "pag.", fr: "paiem." },
    "Nenhum": { pt: "Nenhum", fr: "Aucun" },

    // Botões (titles)
    "Visualizar detalhes": { pt: "Visualizar detalhes", fr: "Voir les détails" },
    "Registrar pagamento": { pt: "Registrar pagamento", fr: "Enregistrer un paiement" },
    "Anexar Comprovante": { pt: "Anexar Comprovante", fr: "Joindre un justificatif" },

    // Dialogs / labels de detalhes
    "Registrar Pagamento": { pt: "Registrar Pagamento", fr: "Enregistrer un paiement" },
    "Detalhes da Conta a Receber": { pt: "Detalhes da Conta a Receber", fr: "Détails du compte client" },
    "Encomenda:": { pt: "Encomenda:", fr: "Commande :" },
    "Cliente:": { pt: "Cliente:", fr: "Client :" },
    "Data Produção:": { pt: "Data Produção:", fr: "Date de production :" },
    "Valor Produtos:": { pt: "Valor Produtos:", fr: "Montant des produits :" },
    "Valor Frete:": { pt: "Valor Frete:", fr: "Frais de port :" },
    "Total:": { pt: "Total:", fr: "Total :" },
    "Valor Recebido:": { pt: "Valor Recebido:", fr: "Montant reçu :" },
    "Saldo:": { pt: "Saldo:", fr: "Solde :" },
    "Quantidade de Pagamentos:": { pt: "Quantidade de Pagamentos:", fr: "Nombre de paiements :" },

    // Anexos
    "Comprovantes e Anexos": { pt: "Comprovantes e Anexos", fr: "Justificatifs et pièces jointes" },
    "Comprovantes de Recebimento": { pt: "Comprovantes de Recebimento", fr: "Justificatifs de paiement" },
  };
  const tr = (key: string) => (dict[key]?.[lang] ?? key);

  const fetchEncomendas = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(`
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
        `)
        // quando showCompleted = false, mostrar apenas saldo > 0
        .gte("saldo_devedor", localShowCompleted ? 0 : 0.01)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas: EncomendaFinanceira[] = (data || []).map((e: any) => ({
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
    } catch (err: any) {
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
      <Card className="shadow-card bg-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-warning" />
                {tr("Vendas - Clientes")}
              </CardTitle>
              <CardDescription>
                {tr("Encomendas com saldo devedor de clientes")}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/30 shadow-inner group">
              <Switch
                id="show-completed-receivable"
                checked={localShowCompleted}
                onCheckedChange={setLocalShowCompleted}
              />
              <Label htmlFor="show-completed-receivable" className="text-xs font-semibold uppercase tracking-wider cursor-pointer">
                {tr("Mostrar Concluídos")}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {/* Tabela apenas no desktop */}
          <div className="hidden xl:block overflow-x-auto rounded-xl border border-border/40 overflow-hidden bg-popover shadow-sm">
            <Table>
              <TableHeader className="bg-popover border-b border-border/40">
                <TableRow className="hover:bg-transparent transition-none border-b-0">
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
                    className="bg-popover hover:bg-muted/30 transition-colors border-b border-border dark:border-white/5 cursor-pointer group last:border-0"
                    onClick={() => handleViewDetails(encomenda)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="group-hover:text-primary transition-colors">{encomenda.numero_encomenda}</span>
                        {encomenda.etiqueta && (
                          <Badge variant="info" className="mt-0.5">
                            {encomenda.etiqueta}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{encomenda.cliente_nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(encomenda.data_producao_estimada)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrencyEUR(encomenda.valor_total)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatCurrencyEUR(encomenda.valor_pago)}
                    </TableCell>
                    <TableCell className="font-semibold text-warning">
                      {formatCurrencyEUR(encomenda.saldo_devedor)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {encomenda.total_pagamentos > 0 ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary underline"
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
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetails(encomenda); }} title={tr("Visualizar detalhes")} type="button" className="hover:text-primary hover:bg-primary/10 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!isHam && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEncomenda(encomenda); setShowPagamentoForm(true); }} title={tr("Registrar pagamento")} type="button" className="hover:text-primary hover:bg-primary/10 transition-colors">
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                        <FinancialAttachmentButton entityType="receivable" entityId={encomenda.id} title={tr("Anexar Comprovante")} onChanged={handleAttachmentChange} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {encomendas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {tr("Nenhuma conta a receber encontrada")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Lista em cartões no mobile/tablet */}
          <div className="xl:hidden space-y-3">
            {encomendas.length === 0 && (
              <Card className="shadow-none border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  {tr("Nenhuma conta a receber encontrada")}
                </CardContent>
              </Card>
            )}
            {encomendas.map((e) => (
              <Card
                key={e.id}
                className="overflow-hidden bg-popover border-border/50 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => handleViewDetails(e)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">#{e.numero_encomenda}</div>
                      {e.etiqueta && (
                        <Badge variant="info" className="mt-0.5">{e.etiqueta}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">{formatDate(e.data_producao_estimada)}</div>
                  </div>
                  <div className="text-sm truncate">{e.cliente_nome}</div>
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
                      <div className="font-semibold text-warning">{formatCurrencyEUR(e.saldo_devedor)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.total_pagamentos > 0 ? (
                      <button
                        className="text-primary underline cursor-pointer"
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
                  <div className="flex flex-col sm:flex-row gap-2 pt-1" onClick={(ev) => ev.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/30 dark:border-sky-800/30" onClick={() => handleViewDetails(e)}>
                      <Eye className="w-4 h-4 mr-2" /> {tr("Visualizar detalhes")}
                    </Button>
                    {!isHam && (
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-800/30" onClick={() => { setSelectedEncomenda(e); setShowPagamentoForm(true); }}>
                        <Plus className="w-4 h-4 mr-2" /> {tr("Registrar pagamento")}
                      </Button>
                    )}
                    <FinancialAttachmentButton
                      entityType="receivable"
                      entityId={e.id}
                      title={tr("Anexar Comprovante")}
                      onChanged={handleAttachmentChange}
                      showLabel={true}
                      className="w-full sm:w-auto bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200/30 dark:border-purple-800/30"
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
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border" aria-describedby="">
            <DialogHeader className="border-b pb-4 mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {tr("Registrar Pagamento")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Associe um novo pagamento à encomenda selecionada.
              </DialogDescription>
            </DialogHeader>
            <PagamentoForm onSuccess={handlePagamentoSuccess} encomendas={[selectedEncomenda]} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Detalhes + Anexos */}
      {selectedEncomenda && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-popover border-border" aria-describedby="">
            <DialogHeader className="border-b pb-4 mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {tr("Detalhes da Conta a Receber")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Confira todas as informações financeiras desta venda.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Detalhes da encomenda - Camada 3 (Destaque sobre Camada 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Encomenda:")}</span>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    #{selectedEncomenda.numero_encomenda}
                    {selectedEncomenda.etiqueta && (
                      <Badge variant="info">{selectedEncomenda.etiqueta}</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Cliente:")}</span>
                  <p className="text-sm font-semibold">{selectedEncomenda.cliente_nome}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Data Produção:")}</span>
                  <p className="text-sm font-semibold italic">
                    {formatDate(selectedEncomenda.data_producao_estimada)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Valor Itens:")}</span>
                  <p className="text-sm font-bold">
                    €{(selectedEncomenda.valor_total - selectedEncomenda.valor_frete).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Valor Frete:")}</span>
                  <p className="text-sm font-bold">
                    {formatCurrencyEUR(selectedEncomenda.valor_frete)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Total:")}</span>
                  <p className="text-sm font-black text-primary">
                    {formatCurrencyEUR(selectedEncomenda.valor_total)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Recebido:")}</span>
                  <p className="text-sm font-bold text-success">
                    {formatCurrencyEUR(selectedEncomenda.valor_pago)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Saldo:")}</span>
                  <p className="text-sm font-black text-warning">
                    {formatCurrencyEUR(selectedEncomenda.saldo_devedor)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{tr("Pagamentos:")}</span>
                  <p className="text-sm font-semibold">{selectedEncomenda.total_pagamentos}</p>
                </div>
              </div>

              {/* Itens da encomenda - Camada Interna (Automático pelo Card do componente) */}
              <OrderItemsView encomendaId={selectedEncomenda.id} />

              {/* Anexos - Camada 3 (Destaque) */}
              <div className="border-t border-border/40 pt-6">
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
