import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
}

export default function Encomendas() {
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
        setEncomendas(data || []);
        
        // Calcular peso para transporte de cada encomenda
        const pesos: { [key: string]: number } = {};
        for (const encomenda of data) {
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

      const pesoTotalGramas = itens.reduce((total, item: any) => {
        return total + (item.quantidade * (item.produtos?.size_weight || 0));
      }, 0);

      const pesoTotalKg = pesoTotalGramas / 1000;
      return pesoTotalKg * 1.30;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gerencie os pedidos dos seus clientes</p>
        </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-9 gap-4">
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
                        <p className="font-medium">{formatDate(encomenda.data_producao_estimada)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data Entrega</p>
                        <p className="font-medium">{formatDate(encomenda.data_envio_estimada)}</p>
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
