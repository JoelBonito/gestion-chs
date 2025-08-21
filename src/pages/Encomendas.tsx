
import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EncomendaForm } from "@/components/EncomendaForm";
import { EncomendaView } from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

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
      setEncomendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
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

  const handleEdit = (encomenda: Encomenda) => {
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

  const filteredEncomendas = encomendas.filter(encomenda => {
    const matchesSearch = encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (encomenda.clientes?.nome && encomenda.clientes.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (encomenda.fornecedores?.nome && encomenda.fornecedores.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = showCompleted ? encomenda.status === 'entregue' : encomenda.status !== 'entregue';
    
    return matchesSearch && matchesStatus;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'producao': return 'bg-blue-500';
      case 'enviado': return 'bg-purple-500';
      case 'entregue': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
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
          <div className="flex items-center space-x-2">
            <Switch
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <Label htmlFor="show-completed">
              {showCompleted ? "Mostrar entregues" : "Mostrar pendentes"}
            </Label>
          </div>
        </CardContent>
      </Card>

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
          <EncomendaForm 
            onSuccess={handleEditSuccess} 
            initialData={selectedEncomenda}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando encomendas...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEncomendas.map((encomenda) => (
            <Card key={encomenda.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-semibold">#{encomenda.numero_encomenda}</p>
                      <p className="text-sm text-muted-foreground">{encomenda.clientes?.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fornecedor</p>
                      <p className="font-medium">{encomenda.fornecedores?.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produção Estimada</p>
                      <p className="font-medium">{formatDate(encomenda.data_producao_estimada)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entrega Estimada</p>
                      <p className="font-medium">{formatDate(encomenda.data_envio_estimada)}</p>
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
          ))}
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
