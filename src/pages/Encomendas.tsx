import { useState, useEffect } from "react";
import { Plus, Search, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
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
}

export default function Encomendas() {
  const { canEdit, hasRole } = useUserRole();
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
                produtos(preco_venda, preco_custo)
              `)
              .eq("encomenda_id", encomenda.id);

            let commission_amount = 0;
            if (!itensError && itens) {
              commission_amount = itens.reduce((total, item: any) => {
                const receita = item.quantidade * (item.produtos?.preco_venda || 0);
                const custo = item.quantidade * (item.produtos?.preco_custo || 0);
                return total + (receita - custo);
              }, 0);
            }

            return {
              ...encomenda,
              commission_amount
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
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
  };

  const handleTransportSuccess = () => {
    setTransportDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
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
    const canEditProduction = canEdit() || hasRole('factory');
    const canEditDelivery = canEdit();
    
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
      return canEdit() || hasRole('factory');
    }
    if (field === 'data_envio_estimada') {
      return canEdit();
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
                    <div className="grid grid-cols-6 gap-4 items-center">
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
                          Visualizar
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(encomenda)}
                          className="w-full"
                        >
                          Editar
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete()}
                          className="w-full"
                        >
                          Deletar
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

                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-950/20 rounded-md border">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {formatCurrency(encomenda.valor_total)}
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
