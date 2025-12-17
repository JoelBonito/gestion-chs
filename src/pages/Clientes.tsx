import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ClienteForm } from "@/components/ClienteForm";
import { ClienteActions } from "@/components/ClienteActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { useUserRole } from "@/hooks/useUserRole";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  active: boolean;
  created_at: string;
}

export default function Clientes() {
  const { canEdit } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      let query = supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
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

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = showInactive ? !cliente.active : cliente.active;

    return matchesSearch && matchesStatus;
  });

  const pageActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Cliente</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente no sistema
          </DialogDescription>
        </DialogHeader>
        <ClienteForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );

  return (
    <OptimizedRoleGuard>
      <PageContainer
        title="Clientes"
        subtitle="Gerencie seus distribuidores e parceiros"
        actions={pageActions}
      >

        {/* Search and filters */}
        <GlassCard className="p-4 mb-6 sticky top-0 z-10 backdrop-blur-md bg-background/60">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar cliente por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-input/50 focus:bg-background/80 transition-all"
              />
            </div>
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive">
                {showInactive ? "Mostrar inativos" : "Mostrar ativos"}
              </Label>
            </div>
          </div>
        </GlassCard>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
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

        {/* Clients Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <GlassCard key={i} className="h-40 animate-pulse bg-muted/20">
                <div />
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <GlassCard
                key={cliente.id}
                className="overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-lg border-border/40"
              >
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold truncate text-foreground">{cliente.nome}</h3>
                      {cliente.email && (
                        <p className="flex items-center mt-1 truncate text-sm text-muted-foreground">
                          {cliente.email}
                        </p>
                      )}
                    </div>
                    <Badge variant={cliente.active ? "success" : "secondary"}>
                      {cliente.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/20">
                    {cliente.telefone ? (
                      <div className="flex items-center text-muted-foreground">
                        <span className="mr-2">📞</span> {cliente.telefone}
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground italic opacity-50">
                        <span className="mr-2">📞</span> Sem telefone
                      </div>
                    )}
                    {cliente.endereco ? (
                      <div className="flex items-center text-muted-foreground break-words">
                        <span className="mr-2">📍</span> {cliente.endereco}
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground italic opacity-50">
                        <span className="mr-2">📍</span> Sem endereço
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                    <span>Cadastrado em:</span>
                    <span>{new Date(cliente.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-2">
                    <ClienteActions
                      cliente={cliente}
                      onEdit={handleEdit}
                      onRefresh={fetchClientes}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {filteredClientes.length === 0 && !loading && (
          <GlassCard className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {showInactive ? "Nenhum cliente inativo encontrado" : "Nenhum cliente ativo encontrado"}
            </p>
            <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2 text-primary">
              Limpar filtros
            </Button>
          </GlassCard>
        )}
      </PageContainer>
    </OptimizedRoleGuard>
  );
}
