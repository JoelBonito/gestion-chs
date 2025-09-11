import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Receipt, DollarSign, Plus, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import EncomendaView from "@/components/EncomendaView";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { AttachmentManager } from "@/components/AttachmentManager";
import { IconWithBadge } from "@/components/ui/icon-with-badge";

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
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [paymentCounts, setPaymentCounts] = useState<Record<string, number>>({});
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

  const handleViewDetails = async (conta: ContaPagar) => {
    setSelectedConta(conta);
    setShowDetails(true);
    await fetchOrderItems(conta.id);
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

  const fetchOrderItems = async (encomendaId: string) => {
    try {
      const { data, error } = await supabase
        .from('itens_encomenda')
        .select(`
          id,
          quantidade,
          preco_custo,
          preco_unitario,
          produtos ( nome, marca, tipo )
        `)
        .eq('encomenda_id', encomendaId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error loading order items:', error);
      setOrderItems([]);
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
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-warning" />
                {t("Compras - Fornecedores")}
              </CardTitle>
              <CardDescription>
                {t("Encomendas com saldo devedor para fornecedores")}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-completed-payable"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="show-completed-payable" className="text-sm">
                {t("Mostrar Concluídos")}
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{conta.numero_encomenda}</span>
                        <span className="mt-0.5">
                          <Badge variant="secondary">{conta.etiqueta || "Nenhum"}</Badge>
                        </span>
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
                      {paymentCounts[conta.id] > 0 ? `${paymentCounts[conta.id]} pag.` : 'Nenhum'}
                    </TableCell>

                    <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(conta)}
                        title={t("Ver Detalhes")}
                        type="button"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                        {!isFelipe && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title={t("Registrar Pagamento")}
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <PagamentoFornecedorForm
                                conta={{...conta, encomenda_id: conta.id}}
                                onSuccess={handlePaymentSuccess}
                              />
                            </DialogContent>
                          </Dialog>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
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
                          <DialogContent className="max-w-2xl" aria-describedby="">
                            <AttachmentManager
                              entityType="payable"
                              entityId={conta.id}
                              title={t("Anexar Comprovante")}
                            />
                          </DialogContent>
                        </Dialog>
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
        </CardContent>
      </Card>

      {/* Dialog: Detalhes + Anexos */}
      {selectedConta && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="">
            <DialogHeader>
              <DialogTitle>{t("Detalhes da Conta a Pagar")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Detalhes da conta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Encomenda:</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedConta.numero_encomenda}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fornecedor:</label>
                  <p className="text-sm text-muted-foreground">{selectedConta.fornecedores?.nome || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Criação:</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedConta.data_criacao).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status:</label>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant="outline">{selectedConta.status}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Total:</label>
                  <p className="text-sm font-semibold">
                    {formatCurrencyEUR(selectedConta.valor_total_custo)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Pago:</label>
                  <p className="text-sm text-success">
                    {formatCurrencyEUR(selectedConta.valor_pago_fornecedor)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo Devedor:</label>
                  <p className="text-sm font-semibold text-warning">
                    {formatCurrencyEUR(selectedConta.saldo_devedor_fornecedor)}
                  </p>
                </div>
              </div>

              {/* Itens da Encomenda */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Itens da Encomenda</h3>
                {orderItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Preço Custo</TableHead>
                          <TableHead className="text-right">Subtotal Custo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.produtos?.nome || 'N/A'}
                            </TableCell>
                            <TableCell>{item.produtos?.marca || 'N/A'}</TableCell>
                            <TableCell>{item.produtos?.tipo || 'N/A'}</TableCell>
                            <TableCell className="text-right">{item.quantidade}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrencyEUR(item.preco_custo)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrencyEUR(item.quantidade * item.preco_custo)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                )}
              </div>

              {/* Anexos */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">{t("Comprovantes e Anexos")}</h3>
                <AttachmentManager
                  entityType="payable"
                  entityId={selectedConta.id}
                  title={t("Comprovantes de Pagamento")}
                  onChanged={handleAttachmentChange}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
