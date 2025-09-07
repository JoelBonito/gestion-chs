import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingDown, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoForm from "@/components/PagamentoForm";
import { FinancialAttachmentButton } from "@/components/FinancialAttachmentButton";
import { AttachmentManager } from "@/components/AttachmentManager";
import { OrderItemsView } from "@/components/OrderItemsView";
import { useLocale } from "@/contexts/LocaleContext";

interface EncomendaFinanceira {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  valor_frete: number;
  total_pagamentos: number;
  data_producao_estimada?: string;
}

interface EncomendasFinanceiroProps {
  onRefreshNeeded?: () => void;
  showCompleted?: boolean;
}

export default function EncomendasFinanceiro({ onRefreshNeeded, showCompleted = false }: EncomendasFinanceiroProps) {
  const [encomendas, setEncomendas] = useState<EncomendaFinanceira[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEncomenda, setSelectedEncomenda] = useState<EncomendaFinanceira | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [localShowCompleted, setLocalShowCompleted] = useState(showCompleted);
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  // --- i18n helper (PT/FR) ---
  type Lang = "pt" | "fr";
  const lang: Lang = isRestrictedFR ? "fr" : "pt";
  const dict: Record<string, { pt: string; fr: string }> = {
    // Títulos / descrições
    "Vendas - Clientes": { pt: "Vendas - Clientes", fr: "Ventes - Clients" },
    "Encomendas com saldo devedor de clientes": {
      pt: "Encomendas com saldo devedor de clientes",
      fr: "Commandes avec solde débiteur des clients"
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
      fr: "Aucun compte à recevoir trouvé"
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
          valor_total,
          valor_pago,
          saldo_devedor,
          valor_frete,
          data_producao_estimada,
          clientes!inner(nome),
          pagamentos(valor_pagamento)
        `)
        .gte("saldo_devedor", localShowCompleted ? 0 : 0.01)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = (data || []).map((encomenda: any) => {
        const totalPagamentos = encomenda.pagamentos?.length || 0;
        return {
          id: encomenda.id,
          numero_encomenda: encomenda.numero_encomenda,
          cliente_nome: encomenda.clientes?.nome ?? "",
          valor_total: parseFloat(encomenda.valor_total || 0),
          valor_pago: parseFloat(encomenda.valor_pago || 0),
          saldo_devedor: parseFloat(encomenda.saldo_devedor || 0),
          valor_frete: parseFloat(encomenda.valor_frete || 0),
          total_pagamentos: totalPagamentos,
          data_producao_estimada: encomenda.data_producao_estimada,
        } as EncomendaFinanceira;
      });

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      console.error("Erro ao carregar encomendas financeiras:", error);
      toast({
        title: "Erro ao carregar encomendas",
        description: error.message,
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(isRestrictedFR ? "fr-FR" : "pt-PT");
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
      <Card className="shadow-card">
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-completed-receivable"
                checked={localShowCompleted}
                onChange={(e) => setLocalShowCompleted(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="show-completed-receivable" className="text-sm">
                {tr("Mostrar Concluídos")}
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={encomenda.id}>
                    <TableCell className="font-medium">
                      {encomenda.numero_encomenda}
                    </TableCell>
                    <TableCell>{encomenda.cliente_nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(encomenda.data_producao_estimada)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      €{encomenda.valor_total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-success">
                      €{encomenda.valor_pago.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold text-warning">
                      €{encomenda.saldo_devedor.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {encomenda.total_pagamentos > 0
                        ? `${encomenda.total_pagamentos} ${tr("pag.")}`
                        : tr("Nenhum")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(encomenda)}
                          title={tr("Visualizar detalhes")}
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEncomenda(encomenda);
                            setShowPagamentoForm(true);
                          }}
                          title={tr("Registrar pagamento")}
                          type="button"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {tr("Nenhuma conta a receber encontrada")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Registrar Pagamento */}
      {selectedEncomenda && (
        <Dialog open={showPagamentoForm} onOpenChange={setShowPagamentoForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{tr("Registrar Pagamento")}</DialogTitle>
            </DialogHeader>
            <PagamentoForm
              onSuccess={handlePagamentoSuccess}
              encomendas={[selectedEncomenda]}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Detalhes + Anexos */}
      {selectedEncomenda && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{tr("Detalhes da Conta a Receber")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Detalhes da encomenda */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{tr("Encomenda:")}</label>
                  <p className="text-sm text-muted-foreground">{selectedEncomenda.numero_encomenda}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Cliente:")}</label>
                  <p className="text-sm text-muted-foreground">{selectedEncomenda.cliente_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Data Produção:")}</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedEncomenda.data_producao_estimada)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Valor Produtos:")}</label>
                  <p className="text-sm text-muted-foreground">
                    €{(selectedEncomenda.valor_total - selectedEncomenda.valor_frete).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Valor Frete:")}</label>
                  <p className="text-sm text-muted-foreground">€{selectedEncomenda.valor_frete.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Total:")}</label>
                  <p className="text-sm font-semibold">€{selectedEncomenda.valor_total.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Valor Recebido:")}</label>
                  <p className="text-sm text-success">€{selectedEncomenda.valor_pago.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Saldo:")}</label>
                  <p className="text-sm font-semibold text-warning">€{selectedEncomenda.saldo_devedor.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{tr("Quantidade de Pagamentos:")}</label>
                  <p className="text-sm text-muted-foreground">{selectedEncomenda.total_pagamentos}</p>
                </div>
              </div>

              {/* Itens da encomenda */}
              <OrderItemsView encomendaId={selectedEncomenda.id} />

              {/* Anexos */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">{tr("Comprovantes e Anexos")}</h3>
                <AttachmentManager
                  entityType="receivable"
                  entityId={selectedEncomenda.id}
                  title={tr("Comprovantes de Recebimento")}
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
