import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Receipt, DollarSign, Plus, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import EncomendaView from "@/components/EncomendaView";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { AttachmentManager } from "@/components/AttachmentManager";
import { IconWithBadge } from "@/components/ui/icon-with-badge";
import { PaymentDetailsModal } from "@/components/PaymentDetailsModal";
import { OrderItemsView } from "@/components/OrderItemsView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

  const isHam = (userEmail?.toLowerCase() ?? "") === "ham@admin.com";
  const isFelipe = (userEmail?.toLowerCase() ?? "") === "felipe@colaborador.com";

  // i18n básico
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      "Contas a Pagar": { pt: "Contas a Pagar", fr: "Comptes à payer" },
      "Pedido": { pt: "Pedido", fr: "Commande" },
      "Fornecedor": { pt: "Fornecedor", fr: "Fournisseur" },
      "Valor Total": { pt: "Valor Total", fr: "Montant total" },
      "Valor Pago": { pt: "Valor Pago", fr: "Montant payé" },
      "Saldo": { pt: "Saldo", fr: "Solde" },
      "Data": { pt: "Data", fr: "Date" },
      "Status": { pt: "Status", fr: "Statut" },
      "Ações": { pt: "Ações", fr: "Actions" },
      "Ver Detalhes": { pt: "Ver Detalhes", fr: "Voir détails" },
      "Registrar Pagamento": { pt: "Registrar Pagamento", fr: "Enregistrer paiement" },
      "Anexar Comprovante": { pt: "Anexar Comprovante", fr: "Joindre justificatif" },
      "Carregando...": { pt: "Carregando...", fr: "Chargement..." },
      "Mostrar Concluídos": { pt: "Mostrar Concluídos", fr: "Afficher terminés" },
      "Compras - Fornecedores": { pt: "Compras - Fornecedores", fr: "Achats - Fournisseurs" },
      "Encomendas com saldo devedor para fornecedores": { pt: "Encomendas com saldo devedor para fornecedores", fr: "Commandes avec solde débiteur aux fournisseurs" },
      "Detalhes da Conta a Pagar": { pt: "Detalhes da Conta a Pagar", fr: "Détails du compte à payer" },
      "Comprovantes e Anexos": { pt: "Comprovantes e Anexos", fr: "Justificatifs et pièces jointes" },
      "Comprovantes de Pagamento": { pt: "Comprovantes de Pagamento", fr: "Justificatifs de paiement" },
    };
    return d[k]?.[lang] ?? k;
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    };
    getUser();
  }, []);

  const fetchContas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("encomendas")
        .select(`
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
        `)
        .gte("saldo_devedor_fornecedor", showCompleted ? 0 : 0.01);

      // Filtro para Felipe - apenas fornecedores específicos
      if (isFelipe) {
        query = query.in("fornecedor_id", [
          "f0920a27-752c-4483-ba02-e7f32beceef6",
          "b8f995d2-47dc-4c8f-9779-ce21431f5244"
        ]);
      }

      const { data, error } = await query.order("data_criacao", { ascending: false });

      if (error) throw error;

      const contasPagar: ContaPagar[] = (data || []).map((item: any) => ({
        ...item,
        encomenda_id: item.id
      }));
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
  };

  useEffect(() => {
    if (userEmail) {
      fetchContas();
    }
  }, [userEmail, showCompleted]);

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

  const loadAttachmentCounts = async () => {
    if (contas.length === 0) return;

    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        contas.map(async (conta) => {
          const { count, error } = await supabase
            .from('attachments')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', 'payable')
            .eq('entity_id', conta.id);

          if (!error) {
            counts[conta.id] = count || 0;
          }
        })
      );

      setAttachmentCounts(counts);
    } catch (error) {
      console.error('Error loading attachment counts:', error);
    }
  };

  const loadPaymentCounts = async () => {
    if (contas.length === 0) return;

    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        contas.map(async (conta) => {
          const { count, error } = await supabase
            .from('pagamentos_fornecedor')
            .select('*', { count: 'exact', head: true })
            .eq('encomenda_id', conta.id);

          if (!error) {
            counts[conta.id] = count || 0;
          }
        })
      );

      setPaymentCounts(counts);
    } catch (error) {
      console.error('Error loading payment counts:', error);
    }
  };

  useEffect(() => {
    if (contas.length > 0) {
      loadAttachmentCounts();
      loadPaymentCounts();
    }
  }, [contas]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{t("Carregando...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (contas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{t("Nenhuma conta a pagar encontrada")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-card bg-card border-border/50">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-warning" />
                {t("Compras - Fornecedores")}
              </CardTitle>
              <CardDescription>
                {t("Encomendas com saldo devedor para fornecedores")}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/30 shadow-inner group">
              <Switch
                id="show-completed-payable"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label htmlFor="show-completed-payable" className="text-xs font-semibold uppercase tracking-wider cursor-pointer">
                {t("Mostrar Concluídos")}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          {/* Tabela apenas no desktop */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-border/40 overflow-hidden bg-popover shadow-sm">
            <Table>
              <TableHeader className="bg-popover border-b border-border/40">
                <TableRow className="hover:bg-transparent transition-none border-b-0">
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
                    className="bg-popover hover:bg-muted/30 transition-colors border-b border-border dark:border-white/5 cursor-pointer group last:border-0"
                    onClick={() => handleViewDetails(conta)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="group-hover:text-primary transition-colors">{conta.numero_encomenda}</span>
                        <Badge variant="info" className="mt-0.5">
                          {conta.etiqueta || "Nenhum"}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell>{conta.fornecedores?.nome || 'N/A'}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(conta.data_criacao).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="font-semibold">
                      {formatCurrencyEUR(conta.valor_total_custo)}
                    </TableCell>

                    <TableCell className="text-success">
                      {formatCurrencyEUR(conta.valor_pago_fornecedor)}
                    </TableCell>

                    <TableCell className="font-semibold text-warning">
                      {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {paymentCounts[conta.id] > 0 ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPaymentConta(conta);
                            setShowPaymentDetails(true);
                          }}
                        >
                          {paymentCounts[conta.id]} pag.
                        </Button>
                      ) : (
                        'Nenhum'
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleViewDetails(conta); }}
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
                            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border" aria-describedby="">
                              <DialogHeader className="border-b pb-4 mb-4">
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                  <Paperclip className="h-5 w-5 text-primary" />
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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("Nenhuma conta a pagar encontrada")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Lista em cartões no mobile/tablet */}
          <div className="lg:hidden space-y-3">
            {contas.length === 0 && (
              <Card className="shadow-none border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  {t("Nenhuma conta a pagar encontrada")}
                </CardContent>
              </Card>
            )}
            {contas.map((conta) => (
              <Card
                key={conta.id}
                className="overflow-hidden bg-card border-border/50 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => handleViewDetails(conta)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">#{conta.numero_encomenda}</div>
                      <Badge variant="info" className="mt-0.5">{conta.etiqueta || "Nenhum"}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">
                      {new Date(conta.data_criacao).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm truncate">{conta.fornecedores?.nome || 'N/A'}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">{t("Valor Total")}</div>
                      <div className="font-semibold">{formatCurrencyEUR(conta.valor_total_custo)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t("Valor Pago")}</div>
                      <div className="text-success">{formatCurrencyEUR(conta.valor_pago_fornecedor)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">{t("Saldo")}</div>
                      <div className="font-semibold text-warning">{formatCurrencyEUR(conta.saldo_devedor_fornecedor)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {paymentCounts[conta.id] > 0 ? (
                      <button
                        className="text-primary underline cursor-pointer"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedPaymentConta(conta);
                          setShowPaymentDetails(true);
                        }}
                      >
                        {paymentCounts[conta.id]} pag.
                      </button>
                    ) : (
                      'Nenhum'
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1" onClick={(ev) => ev.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => handleViewDetails(conta)}>
                      <Eye className="w-4 h-4 mr-2" /> {t("Ver Detalhes")}
                    </Button>
                    {!isFelipe && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setSelectedConta(conta);
                          setShowPaymentForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" /> {t("Registrar Pagamento")}
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto" title={t("Anexar Comprovante")}>
                          <IconWithBadge
                            icon={<Paperclip className="h-4 w-4" />}
                            count={attachmentCounts[conta.id] || 0}
                          />
                          <span className="ml-2">Anexos</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border" aria-describedby={undefined}>
                        <DialogHeader className="border-b pb-4 mb-4">
                          <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Paperclip className="h-5 w-5 text-primary" />
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
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border" aria-describedby="">
            <DialogHeader className="border-b pb-4 mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
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
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border" aria-describedby="">
            <DialogHeader className="border-b pb-4 mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {t("Detalhes da Conta a Pagar")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Confira todas as informações financeiras desta compra.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Detalhes da conta - Camada 3 (Destaque sobre Camada 2) */}
              <div className="bg-popover rounded-xl border border-border/20 p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Pedido")}:</span>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      #{selectedConta.numero_encomenda}
                      {selectedConta.etiqueta && (
                        <Badge variant="info">{selectedConta.etiqueta}</Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Fornecedor")}:</span>
                    <p className="text-sm font-semibold">{selectedConta.fornecedores?.nome || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Data")}:</span>
                    <p className="text-sm font-semibold italic">
                      {new Date(selectedConta.data_criacao).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Status")}:</span>
                    <div>
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                        {selectedConta.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Valor Total")}:</span>
                    <p className="text-sm font-bold">{formatCurrencyEUR(selectedConta.valor_total_custo)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Valor Pago")}:</span>
                    <p className="text-sm font-bold text-success">{formatCurrencyEUR(selectedConta.valor_pago_fornecedor)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Saldo")}:</span>
                    <p className="text-sm font-black text-warning">{formatCurrencyEUR(selectedConta.saldo_devedor_fornecedor)}</p>
                  </div>
                </div>
              </div>

              {/* Itens da Encomenda */}
              <div className="pt-2">
                <OrderItemsView encomendaId={selectedConta.id} showCostPrices={true} />
              </div>

              {/* Anexos - Camada 3 (Destaque) */}
              <div className="border-t border-border/40 pt-6">
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
