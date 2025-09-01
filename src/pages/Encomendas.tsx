import { useState, useEffect } from "react";
import { Plus, Search, Calendar as CalendarIcon, X } from "lucide-react";
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
  const { canEdit } = useUserRole();
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
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const fetchEncomendas = async () => {
    try {
      let query = supabase
        .from("encomendas")
        .select(`
          *,
          clientes(nome),
          fornecedores(nome)
        `);

      // Apply date filters
      if (startDate) {
        const startDateString = startDate.toISOString().split('T')[0];
        query = query.gte('data_criacao', startDateString);
      }
      
      if (endDate) {
        const endDateString = endDate.toISOString().split('T')[0];
        query = query.lte('data_criacao', endDateString);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

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
  }, [startDate, endDate]);

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
      
      toast.success("Data atualizada com sucesso!");
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

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const setQuickFilter = (type: 'today' | 'week' | 'month' | '30days') => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (type) {
      case 'today':
        setStartDate(startOfToday);
        setEndDate(startOfToday);
        break;
      case 'week':
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        setStartDate(startOfWeek);
        setEndDate(startOfToday);
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(startOfMonth);
        setEndDate(startOfToday);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(startOfToday);
        thirtyDaysAgo.setDate(startOfToday.getDate() - 30);
        setStartDate(thirtyDaysAgo);
        setEndDate(startOfToday);
        break;
    }
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

      {/* Date Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filtros de Data</h3>
              {(startDate || endDate) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearDateFilters}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-1 h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
            
            {/* Quick filters */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickFilter('today')}
                className="text-xs"
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickFilter('week')}
                className="text-xs"
              >
                Esta Semana
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickFilter('month')}
                className="text-xs"
              >
                Este Mês
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQuickFilter('30days')}
                className="text-xs"
              >
                Últimos 30 dias
              </Button>
            </div>
            
            {/* Date range selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar data inicial"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => 
                        date > new Date() || (endDate && date > endDate)
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar data final"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => 
                        date > new Date() || (startDate && date < startDate)
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Active filter indicator */}
            {(startDate || endDate) && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Filtros ativos:</span>
                {startDate && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                    A partir de {format(startDate, "dd/MM/yyyy")}
                  </span>
                )}
                {endDate && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                    Até {format(endDate, "dd/MM/yyyy")}
                  </span>
                )}
              </div>
            )}
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-10 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Pedido</p>
                        <p className="font-semibold">#{encomenda.numero_encomenda}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">{encomenda.clientes?.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fornecedor</p>
                        <p className="font-medium">{encomenda.fornecedores?.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data Produção</p>
                        <Input
                          type="date"
                          value={encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleDateUpdate(encomenda.id, 'data_producao_estimada', e.target.value)}
                          className="font-medium text-sm h-8"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data Entrega</p>
                        <Input
                          type="date"
                          value={encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleDateUpdate(encomenda.id, 'data_envio_estimada', e.target.value)}
                          className="font-medium text-sm h-8"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Peso Bruto</p>
                        <p className="font-medium text-blue-600">
                          {pesoBruto.toFixed(2)} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Frete</p>
                        <p className="font-medium text-orange-600">
                          €{(pesoBruto * 4.50).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <EncomendaStatusSelect
                          encomendaId={encomenda.id}
                          currentStatus={encomenda.status}
                          numeroEncomenda={encomenda.numero_encomenda}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="font-semibold">{formatCurrency(encomenda.valor_total)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Comissão</p>
                        <p className={formatCommission(encomenda.commission_amount || 0).className}>
                          {formatCommission(encomenda.commission_amount || 0).formatted}
                        </p>
                      </div>
                    </div>
                    
                    <EncomendaActions
                      encomenda={encomenda}
                      onView={() => handleView(encomenda)}
                      onEdit={() => handleEdit(encomenda)}
                      onDelete={handleDelete}
                    />
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
