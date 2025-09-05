import { useState, useEffect } from "react";
import { Plus, Search, CalendarIcon, Eye, Trash2, Edit, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EncomendaForm } from "@/components/EncomendaForm";
import { EncomendaView } from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";
type StatusFilter = StatusEncomenda | "TODOS";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: StatusEncomenda;
  status_producao?: string;
  valor_total: number;
  valor_pago: number;
  data_criacao: string;
  data_entrega?: string;
  data_producao_estimada?: string;
  data_envio_estimada?: string;
  observacoes?: string;
  cliente_id: string;
  fornecedor_id: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
  commission_amount?: number;
  valor_total_custo?: number;
}

export default function Encomendas() {
  const queryClient = useQueryClient();
  const { canEdit, hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("TODOS");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesoTransporte, setPesoTransporte] = useState<{ [key: string]: number }>({});

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(nome),
          fornecedores(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        // Calculate commission for each order
        const encomendasWithCommission = await Promise.all(
          data.map(async (encomenda) => {
            const { data: itens, error: itensError } = await supabase
              .from("itens_encomenda")
              .select(`
                quantidade,
                preco_unitario,
                preco_custo
              `)
              .eq("encomenda_id", encomenda.id);

            let commission_amount = 0;
            let valor_total_custo = 0;
            if (!itensError && itens) {
              commission_amount = itens.reduce((total, item: any) => {
                const receita = item.quantidade * (item.preco_unitario || 0);
                const custo = item.quantidade * (item.preco_custo || 0);
                const lucro = receita - custo;
                return total + lucro;
              }, 0);
              
              valor_total_custo = itens.reduce((total, item: any) => {
                return total + (item.quantidade * (item.preco_custo || 0));
              }, 0);
            }

            return {
              ...encomenda,
              commission_amount,
              valor_total_custo
            };
          })
        );

        setEncomendas(encomendasWithCommission || []);

        
        // Calcular peso para transporte de cada encomenda
        const pesos: { [key: string]: number } = {};
        for (const encomenda of encomendasWithCommission) {
          const pesoCalculado = await calcularPesoTransporte(encomenda.id);
          pesos[encomenda.id] = pesoCalculado;
        }
        setPesoTransporte(pesos);
      }
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  const calcularPesoTransporte = async (encomendaId: string): Promise<number> => {
    try {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`
          quantidade,
          produtos(size_weight)
        `)
        .eq("encomenda_id", encomendaId);

      if (error || !itens) return 0;

      // Calcular peso bruto: (quantidade * peso_unitário_em_gramas) * 1.30 / 1000 para kg
      const pesoTotalGramas = itens.reduce((total, item: any) => {
        return total + (item.quantidade * (item.produtos?.size_weight || 0));
      }, 0);

      // Multiplicar por 1.30 e converter para kg
      const pesoBrutoKg = (pesoTotalGramas * 1.30) / 1000;
      return pesoBrutoKg;
    } catch (error) {
      console.error("Erro ao calcular peso:", error);
      return 0;
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchEncomendas();
    // Invalidate commission queries to update dashboard
    queryClient.invalidateQueries({ queryKey: ['comissoes-mensais'] });
    queryClient.invalidateQueries({ queryKey: ['comissoes-anuais'] });
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
    // Invalidate commission queries to update dashboard
    queryClient.invalidateQueries({ queryKey: ['comissoes-mensais'] });
    queryClient.invalidateQueries({ queryKey: ['comissoes-anuais'] });
  };

  const handleTransportSuccess = () => {
    setTransportDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
    // Invalidate commission queries to update dashboard
    queryClient.invalidateQueries({ queryKey: ['comissoes-mensais'] });
    queryClient.invalidateQueries({ queryKey: ['comissoes-anuais'] });
  };

  const handleEdit = (encomenda: Encomenda) => {
    console.log("Editando encomenda:", encomenda);
    setSelectedEncomenda(encomenda);
    setEditDialogOpen(true);
  };

  const handleView = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setViewDialogOpen(true);
  };

  const handlePrint = async (encomenda: Encomenda) => {
    try {
      console.log('[OrderPDF] Starting print for order:', encomenda.numero_encomenda);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error("Erro ao abrir janela de impressão");
        return;
      }

      // Create print-friendly HTML content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Encomenda #${encomenda.numero_encomenda}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 12px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; }
            .section { margin-bottom: 15px; }
            .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #333; }
            .grid { display: grid; gap: 10px; }
            .grid-2 { grid-template-columns: 1fr 1fr; }
            .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
            .field { }
            .field-label { font-size: 10px; color: #666; margin-bottom: 2px; }
            .field-value { font-weight: bold; }
            .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; background: #666; }
            .amount { font-size: 14px; font-weight: bold; }
            .amount.positive { color: #059669; }
            .amount.negative { color: #DC2626; }
            thead { display: table-header-group; }
            tbody { display: table-row-group; }
            tr { break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Encomenda #${encomenda.numero_encomenda}</div>
            <div class="subtitle">Criada em ${formatDate(encomenda.data_criacao)}</div>
          </div>

          <div class="section">
            <div class="grid grid-2">
              <div class="field">
                <div class="field-label">Cliente</div>
                <div class="field-value">${encomenda.clientes?.nome || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">Fornecedor</div>
                <div class="field-value">${encomenda.fornecedores?.nome || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="grid grid-3">
              <div class="field">
                <div class="field-label">Valor Total</div>
                <div class="field-value amount">${formatCurrency(encomenda.valor_total)}</div>
              </div>
              <div class="field">
                <div class="field-label">Valor Pago</div>
                <div class="field-value amount positive">${formatCurrency(encomenda.valor_pago)}</div>
              </div>
              <div class="field">
                <div class="field-label">Saldo Devedor</div>
                <div class="field-value amount negative">${formatCurrency(encomenda.valor_total - encomenda.valor_pago)}</div>
              </div>
            </div>
          </div>

          ${encomenda.data_producao_estimada || encomenda.data_envio_estimada || encomenda.data_entrega ? `
          <div class="section">
            <div class="section-title">Datas</div>
            <div class="grid grid-3">
              ${encomenda.data_producao_estimada ? `
                <div class="field">
                  <div class="field-label">Produção Estimada</div>
                  <div class="field-value">${formatDate(encomenda.data_producao_estimada)}</div>
                </div>
              ` : ''}
              ${encomenda.data_envio_estimada ? `
                <div class="field">
                  <div class="field-label">Envio Estimado</div>
                  <div class="field-value">${formatDate(encomenda.data_envio_estimada)}</div>
                </div>
              ` : ''}
              ${encomenda.data_entrega ? `
                <div class="field">
                  <div class="field-label">Data de Entrega</div>
                  <div class="field-value">${formatDate(encomenda.data_entrega)}</div>
                </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${encomenda.observacoes ? `
          <div class="section">
            <div class="section-title">Observações</div>
            <div>${encomenda.observacoes}</div>
          </div>
          ` : ''}
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };

      console.log('[OrderPDF] Print window opened successfully');
      toast.success("Janela de impressão aberta!");
    } catch (error) {
      console.error('[OrderPDF] Error opening print window:', error);
      toast.error("Erro ao abrir impressão");
    }
  };

  const handleDelete = () => {
    fetchEncomendas();
  };

  const handleTransport = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setTransportDialogOpen(true);
  };

  const handleStatusChange = async () => {
    fetchEncomendas();
  };

  const handleDateUpdate = async (encomendaId: string, field: string, value: string) => {
    // Check permissions for date editing
    const canEditProduction = canEdit() || hasRole('factory') || isCollaborator;
    const canEditDelivery = canEdit() || isCollaborator;
    
    if (field === 'data_producao_estimada' && !canEditProduction) {
      toast.error("Sem permissão para editar data de produção");
      return;
    }
    
    if (field === 'data_envio_estimada' && !canEditDelivery) {
      toast.error("Sem permissão para editar data de entrega");
      return;
    }

    try {
      const { error } = await supabase
        .from('encomendas')
        .update({ [field]: value || null })
        .eq('id', encomendaId);

      if (error) throw error;
      
      // Atualizar localmente
      setEncomendas(prev => prev.map(enc => 
        enc.id === encomendaId ? { ...enc, [field]: value } : enc
      ));
      
      const fieldName = field === 'data_producao_estimada' ? 'produção' : 'entrega';
      toast.success(`Data de ${fieldName} atualizada com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  const filteredEncomendas = encomendas.filter(encomenda => {
    const matchesSearch = encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (encomenda.clientes?.nome && encomenda.clientes.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (encomenda.fornecedores?.nome && encomenda.fornecedores.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompletedFilter = showCompleted ? encomenda.status === 'ENTREGUE' : encomenda.status !== 'ENTREGUE';
    
    const matchesStatusFilter = selectedStatus === 'TODOS' || encomenda.status === selectedStatus;
    
    return matchesSearch && matchesCompletedFilter && matchesStatusFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const calcularValorFrete = (pesoBruto: number) => {
    return pesoBruto * 4.50;
  };

  const formatCommission = (value: number) => {
    const formatted = formatCurrency(value);
    const isPositive = value >= 0;
    return {
      formatted,
      className: isPositive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
    };
  };

  const canEditDate = (field: string) => {
    if (field === 'data_producao_estimada') {
      return canEdit() || hasRole('factory') || isCollaborator;
    }
    if (field === 'data_envio_estimada') {
      return canEdit() || isCollaborator;
    }
    return false;
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gerencie os pedidos dos seus clientes</p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Nova Encomenda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Encomenda</DialogTitle>
                <DialogDescription>
                  Crie uma nova encomenda no sistema
                </DialogDescription>
              </DialogHeader>
              <EncomendaForm onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por número, cliente ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label htmlFor="show-completed">
                {showCompleted ? "Mostrar pedidos entregues" : "Mostrar pedidos entregues"}
              </Label>
            </div>
            
            <EncomendaStatusFilter 
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
            />
          </div>
        </CardContent>
      </Card>


      {/* Transport Dialog */}
      <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajustar Encomenda para Transporte</DialogTitle>
            <DialogDescription>
              Ajuste as datas, quantidades finais e veja o peso para transporte
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaTransportForm 
              encomendaId={selectedEncomenda.id}
              onSuccess={handleTransportSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Encomenda</DialogTitle>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaView encomendaId={selectedEncomenda.id} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Encomenda</DialogTitle>
            <DialogDescription>
              Edite as informações da encomenda
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaForm 
              onSuccess={handleEditSuccess} 
              initialData={selectedEncomenda}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando encomendas...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEncomendas.map((encomenda) => {
            const pesoBruto = pesoTransporte[encomenda.id] || 0;
            const valorFrete = calcularValorFrete(pesoBruto);
            
            return (
              <Card key={encomenda.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-3">
                     {/* First line: PEDIDO, CLIENTE, FORNECEDOR, ACTION BUTTONS */}
                     <div className="grid grid-cols-7 gap-4 items-center">
                       <div>
                         <p className="text-sm text-muted-foreground">Pedido</p>
                         <p className="font-bold text-lg">#{encomenda.numero_encomenda}</p>
                       </div>
                       <div>
                         <p className="text-sm text-muted-foreground">Cliente</p>
                         <p className="font-semibold">{encomenda.clientes?.nome}</p>
                       </div>
                       <div>
                         <p className="text-sm text-muted-foreground">Fornecedor</p>
                         <p className="font-semibold">{encomenda.fornecedores?.nome}</p>
                       </div>
                       <div className="flex justify-center">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleView(encomenda)}
                           className="w-full"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                       </div>
                       <div className="flex justify-center">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handlePrint(encomenda)}
                           className="w-full"
                         >
                           <Printer className="h-4 w-4" />
                         </Button>
                       </div>
                       <div className="flex justify-center">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleEdit(encomenda)}
                           className="w-full"
                           disabled={isCollaborator}
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                       </div>
                       <div className="flex justify-center">
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={async () => {
                             try {
                               const { data, error } = await supabase.rpc('delete_encomenda_safely', {
                                 p_encomenda_id: encomenda.id
                               });

                               if (error) throw error;
                               
                               toast.success("Encomenda excluída com sucesso!");
                               handleDelete();
                             } catch (error: any) {
                               console.error("Erro ao excluir encomenda:", error);
                               toast.error(error.message || "Erro ao excluir encomenda");
                             }
                           }}
                           className="w-full"
                           disabled={!canEdit() || isCollaborator}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>

                    {/* Second line: DATA PRODUÇÃO, DATA ENTREGA, PESO BRUTO, VALOR FRETE, STATUS, COMISSÃO, VALOR TOTAL */}
                    <div className="grid grid-cols-7 gap-4 items-start pt-2 border-t border-border">
                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Data Produção</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left font-medium text-sm transition-all",
                                !encomenda.data_producao_estimada && "text-muted-foreground",
                                canEditDate('data_producao_estimada') 
                                  ? 'hover:border-primary cursor-pointer' 
                                  : 'opacity-60 cursor-not-allowed'
                              )}
                              disabled={!canEditDate('data_producao_estimada')}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {encomenda.data_producao_estimada ? (
                                format(new Date(encomenda.data_producao_estimada), "dd/MM/yyyy")
                              ) : (
                                <span className="text-xs">Selecionar</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  handleDateUpdate(encomenda.id, 'data_producao_estimada', date.toISOString().split('T')[0]);
                                }
                              }}
                              className="p-3 pointer-events-auto"
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Data Entrega</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left font-medium text-sm transition-all",
                                !encomenda.data_envio_estimada && "text-muted-foreground",
                                canEditDate('data_envio_estimada') 
                                  ? 'hover:border-primary cursor-pointer' 
                                  : 'opacity-60 cursor-not-allowed'
                              )}
                              disabled={!canEditDate('data_envio_estimada')}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {encomenda.data_envio_estimada ? (
                                format(new Date(encomenda.data_envio_estimada), "dd/MM/yyyy")
                              ) : (
                                <span className="text-xs">Selecionar</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  handleDateUpdate(encomenda.id, 'data_envio_estimada', date.toISOString().split('T')[0]);
                                }
                              }}
                              className="p-3 pointer-events-auto"
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Peso Bruto</p>
                        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border">
                          <p className="font-semibold text-blue-700 dark:text-blue-400 text-sm">
                            {pesoBruto.toFixed(2)} kg
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Valor Frete</p>
                        <div className="px-3 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-md border">
                          <p className="font-semibold text-orange-700 dark:text-orange-400 text-sm">
                            €{(pesoBruto * 4.50).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <EncomendaStatusSelect
                          encomendaId={encomenda.id}
                          currentStatus={encomenda.status}
                          numeroEncomenda={encomenda.numero_encomenda}
                          onStatusChange={handleStatusChange}
                        />
                      </div>

                      {!isCollaborator && (
                        <div className="flex flex-col">
                          <p className="text-sm text-muted-foreground mb-1">Comissão</p>
                          <div className={cn(
                            "px-3 py-2 rounded-md border font-bold text-sm",
                            (encomenda.commission_amount || 0) >= 0 
                              ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400" 
                              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                          )}>
                            <p>{formatCommission(encomenda.commission_amount || 0).formatted}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">
                          {isCollaborator ? "Valor Total (Custo)" : "Valor Total"}
                        </p>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-950/20 rounded-md border">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {formatCurrency(isCollaborator ? (encomenda.valor_total_custo || 0) : encomenda.valor_total)}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredEncomendas.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {showCompleted ? "Nenhuma encomenda entregue encontrada" : "Nenhuma encomenda pendente encontrada"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
