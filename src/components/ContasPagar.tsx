
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Eye, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { FinancialAttachmentButton } from "@/components/FinancialAttachmentButton";
import { AttachmentManager } from "@/components/AttachmentManager";

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  valor_produtos: number;
  valor_frete: number;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
  total_pagamentos: number;
}

interface ContasPagarProps {
  onRefreshNeeded?: () => void;
}

export default function ContasPagar({ onRefreshNeeded }: ContasPagarProps) {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const fetchContas = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          valor_frete,
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
        .not("fornecedor_id", "is", null)
        .gt("saldo_devedor_fornecedor", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contasFormatadas = data
        .filter((encomenda: any) => encomenda.fornecedores?.nome)
        .map((encomenda: any) => {
          const valorProdutos = parseFloat(encomenda.valor_total_custo || 0) - parseFloat(encomenda.valor_frete || 0);
          const totalPagamentos = encomenda.pagamentos_fornecedor?.reduce(
            (sum: number, pag: any) => sum + parseFloat(pag.valor_pagamento || 0), 0
          ) || 0;

          return {
            encomenda_id: encomenda.id,
            numero_encomenda: encomenda.numero_encomenda,
            fornecedor_nome: encomenda.fornecedores.nome,
            valor_produtos: valorProdutos,
            valor_frete: parseFloat(encomenda.valor_frete || 0),
            valor_total_custo: parseFloat(encomenda.valor_total_custo || 0),
            valor_pago_fornecedor: parseFloat(encomenda.valor_pago_fornecedor || 0),
            saldo_devedor_fornecedor: parseFloat(encomenda.saldo_devedor_fornecedor || 0),
            total_pagamentos: encomenda.pagamentos_fornecedor?.length || 0,
          };
        });

      setContas(contasFormatadas);
    } catch (error: any) {
      console.error("ContasPagar - Error loading data:", error);
      toast({
        title: "Erro ao carregar contas a pagar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

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

  if (isLoading) {
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
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Contas a Pagar - Fornecedores
          </CardTitle>
          <CardDescription>
            Encomendas com saldo devedor para fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Encomenda</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Frete</TableHead>
                  <TableHead>Total a Pagar</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Saldo a Pagar</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta) => (
                  <TableRow key={conta.encomenda_id}>
                    <TableCell className="font-medium">
                      {conta.numero_encomenda}
                    </TableCell>
                    <TableCell>{conta.fornecedor_nome}</TableCell>
                    <TableCell>€{conta.valor_produtos.toFixed(2)}</TableCell>
                    <TableCell>€{conta.valor_frete.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">
                      €{conta.valor_total_custo.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-success">
                      €{conta.valor_pago_fornecedor.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold text-warning">
                      €{conta.saldo_devedor_fornecedor.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {conta.total_pagamentos > 0 ? `${conta.total_pagamentos} pag.` : 'Nenhum'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(conta)}
                          title="Visualizar detalhes"
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConta(conta);
                            setShowPagamentoForm(true);
                          }}
                          title="Registrar pagamento"
                          type="button"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <FinancialAttachmentButton
                          entityType="payable"
                          entityId={conta.encomenda_id}
                          title="Anexar Comprovante"
                          onChanged={handleAttachmentChange}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {contas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma conta a pagar encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      {selectedConta && (
        <Dialog open={showPagamentoForm} onOpenChange={setShowPagamentoForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pagamento ao Fornecedor</DialogTitle>
            </DialogHeader>
            <PagamentoFornecedorForm
              onSuccess={handlePagamentoSuccess}
              conta={selectedConta}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Details Dialog with Attachments */}
      {selectedConta && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Order Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Encomenda:</label>
                  <p className="text-sm text-muted-foreground">{selectedConta.numero_encomenda}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Fornecedor:</label>
                  <p className="text-sm text-muted-foreground">{selectedConta.fornecedor_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Produtos:</label>
                  <p className="text-sm text-muted-foreground">€{selectedConta.valor_produtos.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Frete:</label>
                  <p className="text-sm text-muted-foreground">€{selectedConta.valor_frete.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total a Pagar:</label>
                  <p className="text-sm font-semibold">€{selectedConta.valor_total_custo.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Pago:</label>
                  <p className="text-sm text-success">€{selectedConta.valor_pago_fornecedor.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo a Pagar:</label>
                  <p className="text-sm font-semibold text-warning">€{selectedConta.saldo_devedor_fornecedor.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade de Pagamentos:</label>
                  <p className="text-sm text-muted-foreground">{selectedConta.total_pagamentos}</p>
                </div>
              </div>

              {/* Attachments Section */}
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
