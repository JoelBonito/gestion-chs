import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { FinancialAttachmentButton } from "@/components/FinancialAttachmentButton";
import { AttachmentManager } from "@/components/AttachmentManager";
import { OrderItemsView } from "@/components/OrderItemsView";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/LocaleContext";
import { formatCurrencyEUR } from "@/lib/utils/currency";

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  fornecedor_nome: string;
  fornecedor_id: string; // Adicionado para filtro
  valor_produtos: number;
  valor_frete: number;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  total_pagamentos: number;
  data_producao_estimada?: string | null;
}

interface ContasPagarProps {
  onRefreshNeeded?: () => void;
  showCompleted?: boolean;
}

export default function ContasPagar({ onRefreshNeeded, showCompleted = false }: ContasPagarProps) {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localShowCompleted, setLocalShowCompleted] = useState(showCompleted);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const isCollaborator = useIsCollaborator();
  const { isRestrictedFR } = useLocale();

  // Lógica de restrição para Felipe
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";

  // Fornecedores permitidos para o Felipe (UUIDs)
  const ALLOWED_SUPPLIERS_FOR_FELIPE = [
    "f0920a27-752c-4483-ba02-e7f32beceef6",
    "b8f995d2-47dc-4c8f-9779-ce21431f5244",
  ];

  // Buscar email do usuário
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    };
    fetchUser();
  }, []);

  type Lang = "pt" | "fr";
  const lang: Lang = isRestrictedFR ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      // Título/descrição
      "Compras - Fornecedores": { pt: "Compras - Fornecedores", fr: "Achats - Fournisseurs" },
      "Encomendas com saldo devedor para fornecedores": {
        pt: "Encomendas com saldo devedor para fornecedores",
        fr: "Commandes avec solde débiteur envers les fournisseurs",
      },

      // Colunas
      "Nº Encomenda": { pt: "Nº Encomenda", fr: "Nº de commande" },
      "Fornecedor": { pt: "Fornecedor", fr: "Fournisseur" },
      "Data Produção": { pt: "Data Produção", fr: "Date de production" },
      "Total": { pt: "Total", fr: "Total" },
      "Pago": { pt: "Pago", fr: "Payé" },
      "Saldo": { pt: "Saldo", fr: "Solde" },
      "Pagamentos": { pt: "Pagamentos", fr: "Paiements" },
      "Ações": { pt: "Ações", fr: "Actions" },

      // Controles/estados
      "Mostrar Concluídos": { pt: "Mostrar Concluídos", fr: "Afficher terminés" },
      "Carregando contas a pagar...": { pt: "Carregando contas a pagar...", fr: "Chargement des comptes à payer..." },
      "Nenhuma conta a pagar encontrada": { pt: "Nenhuma conta a pagar encontrada", fr: "Aucun compte à payer trouvé" },
      "pag.": { pt: "pag.", fr: "paiem." },
      "Nenhum": { pt: "Nenhum", fr: "Aucun" },

      // Botões / diálogos
      "Visualizar detalhes": { pt: "Visualizar detalhes", fr: "Voir les détails" },
      "Registrar pagamento": { pt: "Registrar pagamento", fr: "Enregistrer un paiement" },
      "Anexar Comprovante": { pt: "Anexar Comprovante", fr: "Joindre un justificatif" },
      "Pagamento ao Fornecedor": { pt: "Pagamento ao Fornecedor", fr: "Paiement au fournisseur" },
      "Detalhes da Conta a Pagar": { pt: "Detalhes da Conta a Pagar", fr: "Détails du compte fournisseur" },

      // Labels detalhes
      "Encomenda:": { pt: "Encomenda:", fr: "Commande :" },
      "Fornecedor:": { pt: "Fornecedor:", fr: "Fournisseur :" },
      "Valor Produtos:": { pt: "Valor Produtos:", fr: "Montant des produits :" },
      "Valor Frete:": { pt: "Valor Frete:", fr: "Frais de port :" },
      "Valor Pago:": { pt: "Valor Pago:", fr: "Montant payé :" },
      "Quantidade de Pagamentos:": { pt: "Quantidade de Pagamentos:", fr: "Nombre de paiements :" },
    };
    return d[k]?.[lang] ?? k;
  };

  const fetchContas = async () => {
    try {
      setIsLoading(true);

      // Monta a query base (LEFT JOIN em fornecedores)
      let query = supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          etiqueta,
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          valor_frete,
          data_producao_estimada,
          fornecedor_id,
          fornecedores(nome),
          itens_encomenda(
            quantidade,
            preco_unitario,
            produtos(nome, marca)
          ),
          pagamentos_fornecedor(
            valor_pagamento
          )
        `)
        .order("created_at", { ascending: false });

      // Filtro de saldo:
      // - quando "Mostrar Concluídos" = true, inclui >= 0 e também NULL
      // - quando false, apenas > 0
      if (localShowCompleted) {
        query = query.or("saldo_devedor_fornecedor.gte.0,saldo_devedor_fornecedor.is.null");
      } else {
        query = query.gt("saldo_devedor_fornecedor", 0);
      }

      const { data, error } = await query;
      if (error) throw error;

      const contasFormatadas: ContaPagar[] = (data || []).map((encomenda: any) => ({
        encomenda_id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        etiqueta: encomenda.etiqueta ?? null,
        fornecedor_id: encomenda.fornecedor_id || "",
        fornecedor_nome:
          (typeof encomenda.fornecedores === "object" && encomenda.fornecedores?.nome)
            ? encomenda.fornecedores.nome
            : "",
        valor_produtos: Number(encomenda.valor_total_custo || 0),
        valor_frete: Number(encomenda.valor_frete || 0),
        valor_total_custo: Number(encomenda.valor_total_custo || 0),
        valor_pago_fornecedor: Number(encomenda.valor_pago_fornecedor || 0),
        saldo_devedor_fornecedor: Number(encomenda.saldo_devedor_fornecedor || 0),
        total_pagamentos: Array.isArray(encomenda.pagamentos_fornecedor)
          ? encomenda.pagamentos_fornecedor.length
          : 0,
        data_producao_estimada: encomenda.data_producao_estimada ?? null,
      }));

      // Aplicar filtro de fornecedores para Felipe
      const contasFiltradas = isFelipe
        ? contasFormatadas.filter((conta) => 
            ALLOWED_SUPPLIERS_FOR_FELIPE.includes(conta.fornecedor_id)
          )
        : contasFormatadas;

      setContas(contasFiltradas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas a pagar",
        description: error.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localShowCompleted, userEmail]); // Adicionado userEmail para refetch quando user é carregado

  const handlePagamentoSuccess = () => {
    fetchContas();
    setShowPagamentoForm(false);
    setSelectedConta(null);
    onRefreshNeeded?.();
  };

  const handleViewDetails = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setShowDetails(true);
  };

  const handleAttachmentChange = () => {
    fetchContas();
    onRefreshNeeded?.();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(isRestrictedFR ? "fr-FR" : "pt-PT");
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{t("Carregando contas a pagar...")}</p>
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
                <AlertTriangle className="h-5 w-5 text-warning" />
                {t("Compras - Fornecedores")}
                {isFelipe && (
                  <span className="text-sm text-muted-foreground font-normal">
                    (Visualização limitada)
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {t("Encomendas com saldo devedor para fornecedores")}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-completed-payable"
                checked={localShowCompleted}
                onChange={(e) => setLocalShowCompleted(e.target.checked)}
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
                  <TableHead>{t("Nº Encomenda")}</TableHead>
                  <TableHead>{t("Fornecedor")}</TableHead>
                  <TableHead>{t("Data Produção")}</TableHead>
                  <TableHead>{t("Total")}</TableHead>
                  <TableHead>{t("Pago")}</TableHead>
                  <TableHead>{t("Saldo")}</TableHead>
                  <TableHead>{t("Pagamentos")}</TableHead>
                  <TableHead>{t("Ações")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {contas.map((conta) => (
                  <TableRow key={conta.encomenda_id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{conta.numero_encomenda}</span>
                        {conta.etiqueta && (
                          <span className="mt-0.5">
                            <Badge variant="secondary">{conta.etiqueta}</Badge>
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{conta.fornecedor_nome}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(conta.data_producao_estimada)}
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
                      {conta.total_pagamentos > 0
                        ? `${conta.total_pagamentos} ${t("pag.")}`
                        : t("Nenhum")}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(conta)}
                          title={t("Visualizar detalhes")}
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Colaborador não registra pagamento ao fornecedor */}
                        {!isCollaborator && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedConta(conta);
                                setShowPagamentoForm(true);
                              }}
                              title={t("Registrar pagamento")}
                              type="button"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <FinancialAttachmentButton
                              entityType="payable"
                              entityId={conta.encomenda_id}
                              title={t("Anexar Comprovante")}
                              onChanged={handleAttachmentChange}
                            />
                          </>
                        )}
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

      {/* Dialog: registrar pagamento ao fornecedor */}
      {selectedConta && (
        <Dialog open={showPagamentoForm} onOpenChange={setShowPagamentoForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("Pagamento ao Fornecedor")}</DialogTitle>
            </DialogHeader>
            <PagamentoFornecedorForm onSuccess={handlePagamentoSuccess} conta={selectedConta} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: detalhes + anexos */}
      {selectedConta && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("Detalhes da Conta a Pagar")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Detalhes da encomenda */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t("Encomenda:")}</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedConta.numero_encomenda}
                    {selectedConta.etiqueta && (
                      <>
                        {" "}
                        — <Badge variant="secondary">{selectedConta.etiqueta}</Badge>
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Fornecedor:")}</label>
                  <p className="text-sm text-muted-foreground">{selectedConta.fornecedor_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Data Produção:")}</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedConta.data_producao_estimada)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Valor Produtos:")}</label>
                  <p className="text-sm text-muted-foreground">{formatCurrencyEUR(selectedConta.valor_produtos)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Valor Frete:")}</label>
                  <p className="text-sm text-muted-foreground">{formatCurrencyEUR(selectedConta.valor_frete)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Total")}:</label>
                  <p className="text-sm font-semibold">{formatCurrencyEUR(selectedConta.valor_total_custo)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Valor Pago:")}</label>
                  <p className="text-sm text-success">{formatCurrencyEUR(selectedConta.valor_pago_fornecedor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Saldo")}:</label>
                  <p className="text-sm font-semibold text-warning">{formatCurrencyEUR(selectedConta.saldo_devedor_fornecedor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("Quantidade de Pagamentos:")}</label>
                  <p className="text-sm text-muted-foreground">{selectedConta.total_pagamentos}</p>
                </div>
              </div>

              {/* Itens da encomenda (com custos) */}
              <OrderItemsView encomendaId={selectedConta.encomenda_id} showCostPrices={true} />

              {/* Anexos */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Comprovantes e Anexos</h3>
                <AttachmentManager
                  entityType="payable"
                  entityId={selectedConta.encomenda_id}
                  title="Comprovantes de Pagamento"
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
