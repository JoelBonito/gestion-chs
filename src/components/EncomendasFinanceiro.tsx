
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Plus, Eye, Download, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoForm from "@/components/PagamentoForm";
import { FinancialAttachmentButton } from "@/components/FinancialAttachmentButton";
import { AttachmentManager } from "@/components/AttachmentManager";
import { OrderItemsView } from "@/components/OrderItemsView";

interface EncomendaFinanceira {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  valor_frete: number;
  total_pagamentos: number;
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
          clientes!inner(nome),
          pagamentos(valor_pagamento)
        `)
        .gte("saldo_devedor", localShowCompleted ? 0 : 0.01)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = data.map((encomenda: any) => {
        const totalPagamentos = encomenda.pagamentos?.length || 0;
        
        return {
          id: encomenda.id,
          numero_encomenda: encomenda.numero_encomenda,
          cliente_nome: encomenda.clientes.nome,
          valor_total: parseFloat(encomenda.valor_total || 0),
          valor_pago: parseFloat(encomenda.valor_pago || 0),
          saldo_devedor: parseFloat(encomenda.saldo_devedor || 0),
          valor_frete: parseFloat(encomenda.valor_frete || 0),
          total_pagamentos: totalPagamentos,
        };
      });

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      console.error('Erro ao carregar encomendas financeiras:', error);
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

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando encomendas...</p>
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
                Contas a Receber - Clientes
              </CardTitle>
              <CardDescription>
                Encomendas com saldo devedor de clientes
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
              <label htmlFor="show-completed-receivable" className="text-sm">Mostrar Concluídos</label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Encomenda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Frete</TableHead>
                  <TableHead>Total a Receber</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>Saldo a Receber</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendas.map((encomenda) => {
                  const valorProdutos = encomenda.valor_total - encomenda.valor_frete;
                  
                  return (
                    <TableRow key={encomenda.id}>
                      <TableCell className="font-medium">
                        {encomenda.numero_encomenda}
                      </TableCell>
                      <TableCell>{encomenda.cliente_nome}</TableCell>
                      <TableCell>€{valorProdutos.toFixed(2)}</TableCell>
                      <TableCell>€{encomenda.valor_frete.toFixed(2)}</TableCell>
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
                        {encomenda.total_pagamentos > 0 ? `${encomenda.total_pagamentos} pag.` : 'Nenhum'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(encomenda)}
                            title="Visualizar detalhes"
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
                            title="Registrar pagamento"
                            type="button"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <FinancialAttachmentButton
                            entityType="receivable"
                            entityId={encomenda.id}
                            title="Anexar Comprovante"
                            onChanged={handleAttachmentChange}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {encomendas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma conta a receber encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      {selectedEncomenda && (
        <Dialog open={showPagamentoForm} onOpenChange={setShowPagamentoForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <PagamentoForm
              onSuccess={handlePagamentoSuccess}
              encomendas={[selectedEncomenda]}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Details Dialog with Attachments */}
      {selectedEncomenda && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Conta a Receber</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Order Details Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Encomenda:</label>
                  <p className="text-sm text-muted-foreground">{selectedEncomenda.numero_encomenda}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Cliente:</label>
                  <p className="text-sm text-muted-foreground">{selectedEncomenda.cliente_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Produtos:</label>
                  <p className="text-sm text-muted-foreground">€{(selectedEncomenda.valor_total - selectedEncomenda.valor_frete).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Frete:</label>
                  <p className="text-sm text-muted-foreground">€{selectedEncomenda.valor_frete.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total a Receber:</label>
                  <p className="text-sm font-semibold">€{selectedEncomenda.valor_total.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Recebido:</label>
                  <p className="text-sm text-success">€{selectedEncomenda.valor_pago.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo a Receber:</label>
                  <p className="text-sm font-semibold text-warning">€{selectedEncomenda.saldo_devedor.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade de Pagamentos:</label>
                  <p className="text-sm text-muted-foreground">{selectedEncomenda.total_pagamentos}</p>
                </div>
              </div>

              {/* Order Items Section */}
              <OrderItemsView encomendaId={selectedEncomenda.id} />

              {/* Attachments Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Comprovantes e Anexos</h3>
                <AttachmentManager 
                  entityType="receivable"
                  entityId={selectedEncomenda.id}
                  title="Comprovantes de Recebimento"
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
