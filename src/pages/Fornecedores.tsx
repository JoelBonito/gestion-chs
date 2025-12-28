import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, MapPin, Package, User, Eye, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FornecedorForm } from "@/components/FornecedorForm";
import { FornecedorActions } from "@/components/FornecedorActions";
import FornecedorView from "@/components/FornecedorView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";
import { Fornecedor } from "@/types/database";

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
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

  const handleView = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setViewDialogOpen(true);
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
        <Button className="w-full sm:w-auto" variant="gradient">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Fornecedor</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
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
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm mb-6 sticky top-0 z-10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedor por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>

          <div className="flex items-center gap-4 px-3 border-l border-border/50 h-8 shrink-0">
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
            </div>
            <Label htmlFor="show-inactive" className="cursor-pointer text-sm font-medium whitespace-nowrap text-foreground dark:text-white">
              Mostrar arquivados
            </Label>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
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

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Fornecedor</DialogTitle>
              <DialogDescription>
                Informações completas do registro
              </DialogDescription>
            </DialogHeader>
            {selectedFornecedor && <FornecedorView fornecedor={selectedFornecedor as any} />}
          </DialogContent>
        </Dialog>

        {/* Suppliers Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-muted/20">
                <div />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredFornecedores.map((fornecedor) => (
              <Card
                key={fornecedor.id}
                className="p-0 overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-lg border-border/40"
              >
                <div className="p-4 flex flex-col cursor-pointer" onClick={() => handleView(fornecedor)}>
                  <div className="mb-2">
                    <h3 className="text-base font-semibold line-clamp-2 text-foreground leading-tight h-10 flex items-center">{fornecedor.nome}</h3>
                  </div>

                  <div className="space-y-2 text-sm bg-popover p-3 rounded-lg border border-border/20 mb-3">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="p-1.5 rounded-full bg-nav-reports/10 text-nav-reports shrink-0">
                        <Mail className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs">{fornecedor.email || "Sem e-mail"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="p-1.5 rounded-full bg-nav-finance/10 text-nav-finance shrink-0">
                        <Phone className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs">{fornecedor.telefone || "Sem telefone"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="p-1.5 rounded-full bg-nav-clients/10 text-nav-clients shrink-0">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <span className="line-clamp-2 text-xs">{fornecedor.endereco || "Sem endereço"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <div className="p-1.5 rounded-full bg-nav-dashboard/10 text-nav-dashboard shrink-0">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs">Cont: {fornecedor.contato || "Nâo informado"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground/50 px-1">
                      <span>Parceiro desde {new Date(fornecedor.created_at).toLocaleDateString()}</span>
                    </div>

                    <FornecedorActions
                      fornecedor={fornecedor}
                      onEdit={handleEdit}
                      onView={handleView}
                      onRefresh={fetchFornecedores}
                    />
                  </div>
                </div>
              </Card>
            ))}

            {/* Card de Adicionar Novo */}
            <div
              onClick={() => setDialogOpen(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/60 rounded-xl bg-card hover:bg-card/80 hover:border-primary/40 transition-all cursor-pointer group h-full min-h-[160px]"
            >
              <div className="p-4 rounded-xl bg-popover border border-border/50 shadow-sm text-primary group-hover:scale-110 transition-transform mb-3">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Cadastrar Fornecedor</h3>
              <p className="text-xs text-muted-foreground text-center mt-1 max-w-[200px]">
                Adicione um novo parceiro para sua rede de produção.
              </p>
            </div>
          </div>
        )}

        {filteredFornecedores.length === 0 && !loading && (
          <Card className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {showInactive ? "Nenhum fornecedor inativo encontrado" : "Nenhum fornecedor ativo encontrado"}
            </p>
            <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2 text-primary">
              Limpar filtros
            </Button>
          </Card>
        )}
      </PageContainer>
    </OptimizedRoleGuard>
  );
}
