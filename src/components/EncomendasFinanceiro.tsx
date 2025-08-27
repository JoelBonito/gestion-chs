
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
import PagamentoForm from "@/components/PagamentoForm";
import { EncomendaView } from "@/components/EncomendaView";
import { FinancialAttachmentUpload } from "./FinancialAttachmentUpload";
import { FinancialAttachmentPreview } from "./FinancialAttachmentPreview";
import { useFinancialAttachments } from "@/hooks/useFinancialAttachments";
import { useUserRole } from "@/hooks/useUserRole";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  valor_frete: number;
  status: string;
  data_criacao: string;
  data_entrega: string;
  pagamentos: Array<{
    id: string;
    valor_pagamento: number;
    forma_pagamento: string;
    data_pagamento: string;
    observacoes?: string;
  }>;
}

interface EncomendasFinanceiroProps {
  onSelectEncomenda?: (encomenda: Encomenda) => void;
}

export default function EncomendasFinanceiro({ onSelectEncomenda }: EncomendasFinanceiroProps) {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
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
  } = useFinancialAttachments('encomenda-receber', selectedEncomendaId || '');

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes!inner(nome),
          pagamentos(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = data.map((encomenda: any) => ({
        id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        cliente_nome: encomenda.clientes.nome,
        valor_total: parseFloat(encomenda.valor_total || 0),
        valor_pago: parseFloat(encomenda.valor_pago || 0),
        saldo_devedor: parseFloat(encomenda.saldo_devedor || 0),
        valor_frete: parseFloat(encomenda.valor_frete || 0),
        status: encomenda.status,
        data_criacao: encomenda.data_criacao,
        data_entrega: encomenda.data_entrega,
        pagamentos: encomenda.pagamentos || [],
      }));

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar encomendas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const handleViewClick = (encomendaId: string) => {
    setViewEncomendaId(encomendaId);
    setViewDialogOpen(true);
  };

  const handleAttachmentClick = (encomendaId: string) => {
    setSelectedEncomendaId(encomendaId);
    setAttachmentDialogOpen(true);
  };

  const handlePagamentoClick = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setPagamentoDialogOpen(true);
  };

  const handlePagamentoSuccess = () => {
    setPagamentoDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
  };

  const filteredEncomendas = encomendas.filter(
    (encomenda) =>
      encomenda.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos com valores corretos incluindo frete
  const totalProdutos = encomendas.reduce((sum, e) => sum + e.valor_total, 0);
  const totalFrete = encomendas.reduce((sum, e) => sum + e.valor_frete, 0);
  const totalCaixa = totalProdutos + totalFrete;
  const totalPago = encomendas.reduce((sum, e) => sum + e.valor_pago, 0);
  const saldoCaixa = Math.max(totalCaixa - totalPago, 0);

  if (loading) {
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
      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Produtos</p>
                <p className="text-lg font-bold">€{totalProdutos.toFixed(2)}</p>
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
              <CheckCircle className="h-5 w-5 text-success" />
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
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">Saldo (Caixa)</p>
                <p className="text-lg font-bold text-warning">€{saldoCaixa.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Encomendas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Encomendas - A Receber</CardTitle>
          <CardDescription>
            Controle de recebimentos por encomenda incluindo produtos e frete
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou número da encomenda..."
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Frete</TableHead>
                  <TableHead>Total (Caixa)</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Saldo (Caixa)</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncomendas.map((encomenda) => {
                  const totalCaixaEncomenda = encomenda.valor_total + encomenda.valor_frete;
                  const saldoCaixaEncomenda = Math.max(totalCaixaEncomenda - encomenda.valor_pago, 0);
                  
                  return (
                    <TableRow key={encomenda.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {encomenda.numero_encomenda}
                      </TableCell>
                      <TableCell>{encomenda.cliente_nome}</TableCell>
                      <TableCell className="font-semibold">
                        €{encomenda.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        €{encomenda.valor_frete.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        €{totalCaixaEncomenda.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-success font-semibold">
                        €{encomenda.valor_pago.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={saldoCaixaEncomenda > 0 ? "text-warning" : "text-success"}>
                          €{saldoCaixaEncomenda.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {encomenda.pagamentos.length > 0 ? (
                            encomenda.pagamentos.map((pagamento) => (
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
                            onClick={() => handleViewClick(encomenda.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          {saldoCaixaEncomenda > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePagamentoClick(encomenda)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagamento
                            </Button>
                          )}
                          {canAttach && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAttachmentClick(encomenda.id)}
                              title="Anexar comprovante"
                            >
                              <Paperclip className="h-4 w-4 mr-1" />
                              Anexar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEncomenda && (
            <PagamentoForm
              onSuccess={handlePagamentoSuccess}
              encomendas={[selectedEncomenda]}
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
                <EncomendaView encomendaId={viewEncomendaId} />
              </TabsContent>
              <TabsContent value="attachments" className="space-y-4">
                <div className="space-y-4">
                  <FinancialAttachmentUpload
                    entityType="encomenda-receber"
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
              <h3 className="text-lg font-semibold">Comprovantes de Recebimento</h3>
            </div>
            
            <FinancialAttachmentUpload
              entityType="encomenda-receber"
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
