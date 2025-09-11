import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Receipt, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import EncomendaView from "@/components/EncomendaView";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { AttachmentManager } from "@/components/AttachmentManager";

interface ContaPagar {
  id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  fornecedor_id: string;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  data_criacao: string;
  status: string;
  encomenda_id: string;
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
      "Nenhuma conta a pagar encontrada": { pt: "Nenhuma conta a pagar encontrada", fr: "Aucun compte à payer trouvé" },
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
          fornecedor_nome,
          fornecedor_id,
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          data_criacao,
          status
        `)
        .gt("saldo_devedor_fornecedor", 0);

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
  }, [userEmail]);

  const handlePaymentSuccess = () => {
    fetchContas();
    toast({
      title: "Sucesso",
      description: "Pagamento registrado com sucesso",
    });
  };

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
    <Card>
      <CardHeader>
        <CardTitle>{t("Contas a Pagar")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Pedido")}</TableHead>
              <TableHead>{t("Fornecedor")}</TableHead>
              <TableHead>{t("Valor Total")}</TableHead>
              <TableHead>{t("Valor Pago")}</TableHead>
              <TableHead>{t("Saldo")}</TableHead>
              <TableHead>{t("Data")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Ações")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="font-medium">{conta.numero_encomenda}</TableCell>
                <TableCell>{conta.fornecedor_nome}</TableCell>
                <TableCell>{formatCurrencyEUR(conta.valor_total_custo)}</TableCell>
                <TableCell>{formatCurrencyEUR(conta.valor_pago_fornecedor)}</TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    {formatCurrencyEUR(conta.saldo_devedor_fornecedor)}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(conta.data_criacao).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant="outline">{conta.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <EncomendaView encomendaId={conta.id} />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <PagamentoFornecedorForm
                          conta={{...conta, encomenda_id: conta.id}}
                          onSuccess={handlePaymentSuccess}
                        />
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
