import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FornecedorForm } from "@/components/FornecedorForm";
import { FornecedorActions } from "@/components/FornecedorActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";

interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  contato?: string;
  active: boolean;
  catalog_url?: string;
  catalog_file?: string;
  created_at: string;
}

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFornecedores = async () => {
    try {
      let query = supabase
        .from("fornecedores")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchFornecedores();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedFornecedor(null);
    fetchFornecedores();
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setEditDialogOpen(true);
  };

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fornecedor.email && fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = showInactive ? !fornecedor.active : fornecedor.active;

    return matchesSearch && matchesStatus;
  });

  const pageActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Fornecedor</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Cadastre um novo fornecedor no sistema
          </DialogDescription>
        </DialogHeader>
        <FornecedorForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );

  return (
    <OptimizedRoleGuard>
      <PageContainer
        title="Fornecedores"
        subtitle="Gerencie suas fábricas e parceiros de produção"
        actions={pageActions}
      >

        {/* Search and filters */}
        <GlassCard className="p-4 mb-6 sticky top-0 z-10 backdrop-blur-md bg-background/60">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar fornecedor por nome ou email..."
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
              <DialogTitle>Editar Fornecedor</DialogTitle>
              <DialogDescription>
                Edite as informações do fornecedor
              </DialogDescription>
            </DialogHeader>
            <FornecedorForm
              onSuccess={handleEditSuccess}
              initialData={selectedFornecedor}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>

        {/* Suppliers Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <GlassCard key={i} className="h-48 animate-pulse bg-muted/20">
                <div />
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFornecedores.map((fornecedor) => (
              <GlassCard
                key={fornecedor.id}
                className="overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-lg border-border/40"
              >
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold truncate text-foreground">{fornecedor.nome}</h3>
                      {fornecedor.email && (
                        <p className="flex items-center mt-1 truncate text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {fornecedor.email}
                        </p>
                      )}
                    </div>
                    <Badge variant={fornecedor.active ? "success" : "secondary"}>
                      {fornecedor.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/20">
                    {fornecedor.telefone ? (
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="h-3 w-3 mr-2 text-primary/70" />
                        {fornecedor.telefone}
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground italic opacity-50">
                        <span className="mr-2">📞</span> Sem telefone
                      </div>
                    )}
                    {fornecedor.endereco ? (
                      <div className="flex items-center text-muted-foreground break-words">
                        <MapPin className="h-3 w-3 mr-2 text-primary/70" />
                        {fornecedor.endereco}
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground italic opacity-50">
                        <span className="mr-2">📍</span> Sem endereço
                      </div>
                    )}
                    {fornecedor.contato && (
                      <div className="flex items-center text-muted-foreground">
                        <Package className="h-3 w-3 mr-2 text-primary/70" />
                        contato: {fornecedor.contato}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                    <span>Cadastrado em:</span>
                    <span>{new Date(fornecedor.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-2">
                    <FornecedorActions
                      fornecedor={fornecedor}
                      onEdit={handleEdit}
                      onRefresh={fetchFornecedores}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {filteredFornecedores.length === 0 && !loading && (
          <GlassCard className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {showInactive ? "Nenhum fornecedor inativo encontrado" : "Nenhum fornecedor ativo encontrado"}
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
