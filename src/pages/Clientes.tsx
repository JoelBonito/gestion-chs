import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClienteForm } from "@/components/ClienteForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  created_at: string;
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchClientes();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedCliente(null);
    fetchClientes();
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setEditDialogOpen(true);
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = () => {
    return { label: "Ativo", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus distribuidores e parceiros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente no sistema
              </DialogDescription>
            </DialogHeader>
            <ClienteForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Edite as informações do cliente
              </DialogDescription>
            </DialogHeader>
            <ClienteForm 
              onSuccess={handleEditSuccess} 
              initialData={selectedCliente}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar cliente por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((cliente) => {
            const status = getStatusBadge();
            return (
              <Card key={cliente.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                      {cliente.email && (
                        <CardDescription className="flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {cliente.email}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    {cliente.telefone && (
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="h-3 w-3 mr-2" />
                        {cliente.telefone}
                      </div>
                    )}
                    {cliente.endereco && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-2" />
                        {cliente.endereco}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Cadastrado em:</span>
                    <span>{new Date(cliente.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Detalhes
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(cliente)}>
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredClientes.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}