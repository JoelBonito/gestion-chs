import { useState, useEffect } from "react";
import { Plus, Search, CalendarIcon, Eye, Trash2, Edit, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { useFormatters } from "@/hooks/useFormatters";
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

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";
type StatusFilter = StatusEncomenda | "TODOS";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  etiqueta?: string;
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
  const { locale, isRestrictedFR } = useLocale();
  const { formatCurrency, formatDate } = useFormatters();
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
        const encomendasWithCommission = await Promise.all(
          data.map(async (encomenda) => {
            const { data: itens, error: itensError } = await supabase
              .from("itens_encomenda")
              .select(`quantidade, preco_unitario, preco_custo`)
              .eq("encomenda_id", encomenda.id);

            let commission_amount = 0;
            let valor_total_custo = 0;
            if (!itensError && itens) {
              commission_amount = itens.reduce((total, item: any) => {
                const receita = Number(item.quantidade || 0) * Number(item.preco_unitario || 0);
                const custo = Number(item.quantidade || 0) * Number(item.preco_custo || 0);
                const lucro = receita - custo;
                return total + lucro;
              }, 0);
              
              valor_total_custo = itens.reduce((total, item: any) => {
                return total + (Number(item.quantidade || 0) * Number(item.preco_custo || 0));
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
        .select(`quantidade, produtos(size_weight)`)
        .eq("encomenda_id", encomendaId);

      if (error || !itens) return 0;

      const pesoTotalGramas = itens.reduce((total, item: any) => {
        const quantidade = Number(item.quantidade || 0);
        const sizeWeight = Number(item.produtos?.size_weight || 0);
        return total + (quantidade * sizeWeight);
      }, 0);

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

  const handlePrint = async (encomenda: Encomenda) => {
    try {
      console.log('[OrderPDF] Starting print for order:', encomenda.numero_encomenda);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error("Erro ao abrir janela de impressão");
        return;
      }

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
            .content { margin: 20px 0; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; display: inline-block; width: 120px; }
            .value { display: inline-block; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Encomenda #${encomenda.numero_encomenda}</div>
            ${encomenda.etiqueta ? `<div class="subtitle">Etiqueta: ${encomenda.etiqueta}</div>` : ""}
            <div class="subtitle">Criada em ${formatDate(encomenda.data_criacao)}</div>
          </div>

          <div class="content">
            <div class="section">
              <div><span class="label">Cliente:</span> <span class="value">${encomenda.clientes?.nome || 'N/A'}</span></div>
              <div><span class="label">Fornecedor:</span> <span class="value">${encomenda.fornecedores?.nome || 'N/A'}</span></div>
              <div><span class="label">Status:</span> <span class="value">${encomenda.status}</span></div>
              <div><span class="label">Valor Total:</span> <span class="value">${formatCurrency(encomenda.valor_total)}</span></div>
              <div><span class="label">Valor Pago:</span> <span class="value">${formatCurrency(encomenda.valor_pago)}</span></div>
            </div>

            ${encomenda.observacoes ? `
              <div class="section">
                <div class="label">Observações:</div>
                <div>${encomenda.observacoes}</div>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            Documento gerado em ${formatDate(new Date().toISOString())}
          </div>
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
    const q = searchTerm.toLowerCase();
    const matchesSearch = encomenda.numero_encomenda.toLowerCase().includes(q) ||
      (encomenda.clientes?.nome && encomenda.clientes.nome.toLowerCase().includes(q)) ||
      (encomenda.fornecedores?.nome && encomenda.fornecedores.nome.toLowerCase().includes(q)) ||
      (encomenda.etiqueta && encomenda.etiqueta.toLowerCase().includes(q));

    const matchesCompletedFilter = showCompleted ? encomenda.status === 'ENTREGUE' : encomenda.status !== 'ENTREGUE';
    const matchesStatusFilter = selectedStatus === 'TODOS' || encomenda.status === selectedStatus;

    return matchesSearch && matchesCompletedFilter && matchesStatusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando encomendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gerencie suas encomendas</p>
        </div>
        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Encomenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Encomenda</DialogTitle>
                <DialogDescription>
                  Crie uma nova encomenda preenchendo os dados abaixo.
                </DialogDescription>
              </DialogHeader>
              <EncomendaForm onSuccess={() => {
                setDialogOpen(false);
                fetchEncomendas();
              }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros e pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente, fornecedor ou etiqueta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <EncomendaStatusFilter
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
                <Label htmlFor="show-completed">Mostrar entregues</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de encomendas */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas ({filteredEncomendas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEncomendas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Número</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Valor Total</th>
                    <th className="text-left p-2">Comissão</th>
                    <th className="text-left p-2">Data Produção</th>
                    <th className="text-left p-2">Data Entrega</th>
                    <th className="text-left p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEncomendas.map((encomenda) => (
                    <tr key={encomenda.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">{encomenda.numero_encomenda}</div>
                        {encomenda.etiqueta && (
                          <div className="text-xs text-muted-foreground">{encomenda.etiqueta}</div>
                        )}
                      </td>
                      <td className="p-2">{encomenda.clientes?.nome || 'N/A'}</td>
                      <td className="p-2">
                        <EncomendaStatusSelect
                          encomenda={encomenda}
                          onStatusChange={handleStatusChange}
                        />
                      </td>
                      <td className="p-2">{formatCurrency(encomenda.valor_total)}</td>
                      <td className="p-2">
                        <span className={cn(
                          "font-medium",
                          (encomenda.commission_amount || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatCurrency(encomenda.commission_amount || 0)}
                        </span>
                      </td>
                      <td className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-[140px] justify-start text-left font-normal",
                                !encomenda.data_producao_estimada && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {encomenda.data_producao_estimada ? (
                                formatDate(encomenda.data_producao_estimada)
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined}
                              onSelect={(date) => {
                                const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                                handleDateUpdate(encomenda.id, 'data_producao_estimada', dateString);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="p-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-[140px] justify-start text-left font-normal",
                                !encomenda.data_envio_estimada && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {encomenda.data_envio_estimada ? (
                                formatDate(encomenda.data_envio_estimada)
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined}
                              onSelect={(date) => {
                                const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                                handleDateUpdate(encomenda.id, 'data_envio_estimada', dateString);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEncomenda(encomenda);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(encomenda)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {canEdit() && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEncomenda(encomenda);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <EncomendaActions
                                encomenda={encomenda}
                                onDelete={handleDelete}
                                onTransport={() => handleTransport(encomenda)}
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visualizar Encomenda #{selectedEncomenda?.numero_encomenda}
            </DialogTitle>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaView encomenda={selectedEncomenda} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Encomenda #{selectedEncomenda?.numero_encomenda}
            </DialogTitle>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaForm
              encomenda={selectedEncomenda}
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configurar Transporte - #{selectedEncomenda?.numero_encomenda}
            </DialogTitle>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaTransportForm
              encomenda={selectedEncomenda}
              peso={pesoTransporte[selectedEncomenda.id] || 0}
              onSuccess={() => {
                setTransportDialogOpen(false);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
