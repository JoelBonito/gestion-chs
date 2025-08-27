
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Calendar, CreditCard, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { FinancialAttachmentButton } from "./FinancialAttachmentButton";

interface ContaPagar {
  id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  data_criacao: string;
  data_entrega: string;
  status: string;
  pagamentos: Array<{
    id: string;
    valor_pagamento: number;
    forma_pagamento: string;
    data_pagamento: string;
    observacoes?: string;
  }>;
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          fornecedores!inner(nome),
          pagamentos_fornecedor(*)
        `)
        .gt("saldo_devedor_fornecedor", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contasFormatadas = data.map((encomenda: any) => ({
        id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        fornecedor_nome: encomenda.fornecedores.nome,
        valor_total_custo: parseFloat(encomenda.valor_total_custo || 0),
        valor_pago_fornecedor: parseFloat(encomenda.valor_pago_fornecedor || 0),
        saldo_devedor_fornecedor: parseFloat(encomenda.saldo_devedor_fornecedor || 0),
        data_criacao: encomenda.data_criacao,
        data_entrega: encomenda.data_entrega,
        status: encomenda.status,
        pagamentos: encomenda.pagamentos_fornecedor || [],
      }));

      setContas(contasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas a pagar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const handlePagamentoClick = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setPagamentoDialogOpen(true);
  };

  const handlePagamentoSuccess = () => {
    setPagamentoDialogOpen(false);
    setSelectedConta(null);
    fetchContas();
  };

  const filteredContas = contas.filter(
    (conta) =>
      conta.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAPagar = contas.reduce((sum, c) => sum + c.saldo_devedor_fornecedor, 0);
  const totalPago = contas.reduce((sum, c) => sum + c.valor_pago_fornecedor, 0);
  const totalGeral = contas.reduce((sum, c) => sum + c.valor_total_custo, 0);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando contas a pagar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Geral</p>
                <p className="text-lg font-bold">€{totalGeral.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">Total Pago</p>
                <p className="text-lg font-bold text-success">€{totalPago.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">A Pagar</p>
                <p className="text-lg font-bold text-warning">€{totalAPagar.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Controle de pagamentos para fornecedores
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por fornecedor ou número da encomenda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Encomenda</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Total Custo</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.map((conta) => (
                  <TableRow key={conta.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {conta.numero_encomenda}
                    </TableCell>
                    <TableCell>{conta.fornecedor_nome}</TableCell>
                    <TableCell className="font-semibold">
                      €{conta.valor_total_custo.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-success font-semibold">
                      €{conta.valor_pago_fornecedor.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <span className={conta.saldo_devedor_fornecedor > 0 ? "text-warning" : "text-success"}>
                        €{conta.saldo_devedor_fornecedor.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {conta.pagamentos.length > 0 ? (
                          conta.pagamentos.map((pagamento) => (
                            <div key={pagamento.id} className="text-xs text-muted-foreground">
                              €{pagamento.valor_pagamento.toFixed(2)} ({pagamento.forma_pagamento}) - {pagamento.data_pagamento}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhum pagamento</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {conta.saldo_devedor_fornecedor > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePagamentoClick(conta)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                        <FinancialAttachmentButton
                          entityId={conta.id}
                          entityType="financeiro"
                          title="Anexar Fatura"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedConta && (
            <PagamentoFornecedorForm
              onSuccess={handlePagamentoSuccess}
              encomendas={[selectedConta]}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
