
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle, CreditCard, Eye, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";
import { EncomendaViewCusto } from "@/components/EncomendaViewCusto";
import { FinancialAttachmentUpload } from "./FinancialAttachmentUpload";
import { FinancialAttachmentPreview } from "./FinancialAttachmentPreview";
import { useFinancialAttachments } from "@/hooks/useFinancialAttachments";
import { useUserRole } from "@/hooks/useUserRole";

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  custo_produtos: number;
  valor_frete: number;
  total_caixa_pagar: number;
  valor_pago_fornecedor: number;
  saldo_pagar_caixa: number;
  pagamentos_fornecedor: Array<{
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
  const [viewEncomendaId, setViewEncomendaId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [selectedEncomendaId, setSelectedEncomendaId] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasRole } = useUserRole();
  
  const canAttach = hasRole('admin') || hasRole('finance');

  const {
    attachments,
    isLoading: attachmentsLoading,
    createAttachment,
    deleteAttachment,
    isCreating
  } = useFinancialAttachments('encomenda-pagar', selectedEncomendaId || '');

  const fetchContasPagar = async () => {
    try {
      console.log("Buscando contas a pagar...");
      
      const { data: encomendasData, error: encomendasError } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_frete,
          valor_pago_fornecedor,
          fornecedores!inner(nome),
          itens_encomenda(
            quantidade,
            produtos!inner(preco_custo)
          )
        `)
        .order("created_at", { ascending: false });

      if (encomendasError) {
        console.error("Erro ao buscar encomendas:", encomendasError);
        throw encomendasError;
      }

      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from("pagamentos_fornecedor")
        .select("*");

      if (pagamentosError) {
        console.error("Erro ao buscar pagamentos fornecedor:", pagamentosError);
      }

      const contasFormatadas = encomendasData?.map((encomenda: any) => {
        // Calcular custo dos produtos
        const custoItens = encomenda.itens_encomenda?.reduce((sum: number, item: any) => {
          const precoCusto = parseFloat(item.produtos?.preco_custo || 0);
          return sum + (item.quantidade * precoCusto);
        }, 0) || 0;

        const valorFrete = parseFloat(encomenda.valor_frete || 0);
        const totalCaixaPagar = custoItens + valorFrete;

        const pagamentosFornecedor = pagamentosData?.filter(
          (pagamento: any) => pagamento.encomenda_id === encomenda.id
        ) || [];

        const valorPagoFornecedor = pagamentosFornecedor.reduce((sum: number, pagamento: any) => {
          return sum + parseFloat(pagamento.valor_pagamento || 0);
        }, 0);

        const saldoPagarCaixa = Math.max(totalCaixaPagar - valorPagoFornecedor, 0);

        return {
          encomenda_id: encomenda.id,
          numero_encomenda: encomenda.numero_encomenda,
          fornecedor_nome: encomenda.fornecedores?.nome || "N/A",
          custo_produtos: custoItens,
          valor_frete: valorFrete,
          total_caixa_pagar: totalCaixaPagar,
          valor_pago_fornecedor: valorPagoFornecedor,
          saldo_pagar_caixa: saldoPagarCaixa,
          pagamentos_fornecedor: pagamentosFornecedor.map((p: any) => ({
            id: p.id,
            valor_pagamento: parseFloat(p.valor_pagamento),
            forma_pagamento: p.forma_pagamento,
            data_pagamento: p.data_pagamento,
            observacoes: p.observacoes
          })),
        };
      }) || [];

      console.log("Contas formatadas:", contasFormatadas.length);
      setContas(contasFormatadas);
    } catch (error: any) {
      console.error("Erro completo:", error);
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
    fetchContasPagar();
  }, []);

  const handlePagamentoClick = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setPagamentoDialogOpen(true);
  };

  const handlePagamentoSuccess = () => {
    setPagamentoDialogOpen(false);
    setSelectedConta(null);
    fetchContasPagar();
  };

  const handleViewClick = (encomendaId: string) => {
    setViewEncomendaId(encomendaId);
    setViewDialogOpen(true);
  };

  const handleAttachmentClick = (encomendaId: string) => {
    setSelectedEncomendaId(encomendaId);
    setAttachmentDialogOpen(true);
  };

  const filteredContas = contas.filter(
    (conta) =>
      conta.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos dos totais
  const totalCustoProdutos = contas.reduce((sum, c) => sum + c.custo_produtos, 0);
  const totalFrete = contas.reduce((sum, c) => sum + c.valor_frete, 0);
  const totalCaixa = contas.reduce((sum, c) => sum + c.total_caixa_pagar, 0);
  const totalPago = contas.reduce((sum, c) => sum + c.valor_pago_fornecedor, 0);
  const saldoCaixa = contas.reduce((sum, c) => sum + c.saldo_pagar_caixa, 0);

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
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Custo Produtos</p>
                <p className="text-lg font-bold">€{totalCustoProdutos.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Frete</p>
                <p className="text-lg font-bold">€{totalFrete.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Total (Caixa)</p>
                <p className="text-lg font-bold">€{totalCaixa.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">Pago Fornecedor</p>
                <p className="text-lg font-bold text-success">€{totalPago.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Saldo (Caixa)</p>
                <p className="text-lg font-bold text-warning">€{saldoCaixa.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas a Pagar */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Valores devidos aos fornecedores incluindo custos de produtos e frete
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
          {contas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma conta a pagar encontrada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Encomenda</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Custo Produtos</TableHead>
                    <TableHead>Frete</TableHead>
                    <TableHead>Total (Caixa)</TableHead>
                    <TableHead>Pago Fornecedor</TableHead>
                    <TableHead>Saldo (Caixa)</TableHead>
                    <TableHead>Pagamentos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContas.map((conta) => (
                    <TableRow key={conta.encomenda_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {conta.numero_encomenda}
                      </TableCell>
                      <TableCell>{conta.fornecedor_nome}</TableCell>
                      <TableCell className="font-semibold">
                        €{conta.custo_produtos.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        €{conta.valor_frete.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        €{conta.total_caixa_pagar.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-success font-semibold">
                        €{conta.valor_pago_fornecedor.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={conta.saldo_pagar_caixa > 0 ? "text-warning" : "text-success"}>
                          €{conta.saldo_pagar_caixa.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {conta.pagamentos_fornecedor.length > 0 ? (
                            conta.pagamentos_fornecedor.map((pagamento) => (
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClick(conta.encomenda_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePagamentoClick(conta)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pagamento
                          </Button>
                          {canAttach && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAttachmentClick(conta.encomenda_id)}
                              title="Anexar comprovante"
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Anexar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedConta && (
            <PagamentoFornecedorForm
              onSuccess={handlePagamentoSuccess}
              conta={selectedConta}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewEncomendaId && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes da Encomenda</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <EncomendaViewCusto encomendaId={viewEncomendaId} />
              </TabsContent>
              <TabsContent value="attachments" className="space-y-4">
                <div className="space-y-4">
                  <FinancialAttachmentUpload
                    entityType="encomenda-pagar"
                    entityId={viewEncomendaId}
                    onUploadSuccess={createAttachment}
                    disabled={isCreating}
                  />
                  <FinancialAttachmentPreview
                    attachments={attachments}
                    onDelete={deleteAttachment}
                    isLoading={attachmentsLoading}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Anexos */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Comprovantes de Pagamento</h3>
            </div>
            
            <FinancialAttachmentUpload
              entityType="encomenda-pagar"
              entityId={selectedEncomendaId || ''}
              onUploadSuccess={createAttachment}
              disabled={isCreating}
            />
            
            <FinancialAttachmentPreview
              attachments={attachments}
              onDelete={deleteAttachment}
              isLoading={attachmentsLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
