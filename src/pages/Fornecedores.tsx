import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, MapPin, Package, User, Eye, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FornecedorForm } from "@/components/fornecedores";
import { FornecedorActions } from "@/components/fornecedores";
import { FornecedorView } from "@/components/fornecedores";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { PageContainer } from "@/components/shared";
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
      const query = supabase
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

  const filteredFornecedores = fornecedores.filter((fornecedor) => {
    const matchesSearch =
      fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <DialogContent className="bg-card max-h-[90vh] w-[95vw] max-w-[500px] overflow-y-auto border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>Cadastre um novo fornecedor no sistema</DialogDescription>
        </DialogHeader>
        <FornecedorForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );

  return (
    <OptimizedRoleGuard blockHam={true}>
      <PageContainer
        title="Fornecedores"
        subtitle="Gerencie suas fábricas e parceiros de produção"
        actions={pageActions}
      >
        {/* Search and filters */}
        <div className="bg-card border-border sticky top-0 z-10 mb-6 flex flex-col items-center gap-4 rounded-xl border p-3 shadow-sm sm:flex-row">
          <div className="relative w-full flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar fornecedor por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-10"
            />
          </div>

          <div className="border-border/50 flex h-8 shrink-0 items-center gap-4 border-l px-3">
            <div className="flex items-center gap-2">
              <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            </div>
            <Label
              htmlFor="show-inactive"
              className="text-foreground cursor-pointer text-sm font-medium whitespace-nowrap"
            >
              Mostrar arquivados
            </Label>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-card max-h-[90vh] w-[95vw] max-w-[500px] overflow-y-auto border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
              <DialogDescription>Edite as informações do fornecedor</DialogDescription>
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
          <DialogContent className="bg-card max-h-[90vh] w-[95vw] max-w-[700px] overflow-y-auto border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Fornecedor</DialogTitle>
              <DialogDescription>Informações completas do registro</DialogDescription>
            </DialogHeader>
            {selectedFornecedor && <FornecedorView fornecedor={selectedFornecedor as any} />}
          </DialogContent>
        </Dialog>

        {/* Suppliers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-muted/20 h-48 animate-pulse">
                <div />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFornecedores.map((fornecedor) => (
              <Card
                key={fornecedor.id}
                className="border-border/40 overflow-hidden p-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <div
                  className="flex cursor-pointer flex-col p-4"
                  onClick={() => handleView(fornecedor)}
                >
                  <div className="mb-2">
                    <h3 className="text-foreground line-clamp-2 flex h-10 items-center text-base leading-tight font-semibold">
                      {fornecedor.nome}
                    </h3>
                  </div>

                  <div className="bg-popover border-border/20 mb-3 space-y-2 rounded-lg border p-3 text-sm">
                    <div className="text-muted-foreground flex items-center gap-2.5">
                      <div className="bg-nav-reports/10 text-nav-reports shrink-0 rounded-full p-1.5">
                        <Mail className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs">{fornecedor.email || "Sem e-mail"}</span>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2.5">
                      <div className="bg-nav-finance/10 text-nav-finance shrink-0 rounded-full p-1.5">
                        <Phone className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs">
                        {fornecedor.telefone || "Sem telefone"}
                      </span>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2.5">
                      <div className="bg-nav-clients/10 text-nav-clients shrink-0 rounded-full p-1.5">
                        <MapPin className="h-3 w-3" />
                      </div>
                      <span className="line-clamp-2 text-xs">
                        {fornecedor.endereco || "Sem endereço"}
                      </span>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-2.5">
                      <div className="bg-nav-dashboard/10 text-nav-dashboard shrink-0 rounded-full p-1.5">
                        <User className="h-3 w-3" />
                      </div>
                      <span className="truncate text-xs">
                        Cont: {fornecedor.contato || "Nâo informado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-muted-foreground/50 flex items-center justify-between px-1 text-[9px] tracking-wider uppercase">
                      <span>
                        Parceiro desde {new Date(fornecedor.created_at).toLocaleDateString()}
                      </span>
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
              className="border-border/60 bg-card hover:bg-card/80 hover:border-primary/40 group flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all"
            >
              <div className="bg-popover border-border/50 text-primary mb-3 rounded-xl border p-4 shadow-sm transition-transform group-hover:scale-110">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-foreground text-base font-semibold">Cadastrar Fornecedor</h3>
              <p className="text-muted-foreground mt-1 max-w-[200px] text-center text-xs">
                Adicione um novo parceiro para sua rede de produção.
              </p>
            </div>
          </div>
        )}

        {filteredFornecedores.length === 0 && !loading && (
          <Card className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              {showInactive
                ? "Nenhum fornecedor inativo encontrado"
                : "Nenhum fornecedor ativo encontrado"}
            </p>
            <Button variant="link" onClick={() => setSearchTerm("")} className="text-primary mt-2">
              Limpar filtros
            </Button>
          </Card>
        )}
      </PageContainer>
    </OptimizedRoleGuard>
  );
}
