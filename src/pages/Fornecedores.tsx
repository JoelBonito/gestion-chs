
import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FornecedorForm } from "@/components/FornecedorForm";
import { FornecedorActions } from "@/components/FornecedorActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";

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

  return (
    <OptimizedRoleGuard blockCollaborator={true} redirectTo="/produtos">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie suas fábricas e parceiros de produção</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Cadastre um novo fornecedor no sistema
              </DialogDescription>
            </DialogHeader>
            <FornecedorForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar fornecedor por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive">
              {showInactive ? "Mostrar inativos" : "Mostrar ativos"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredFornecedores.map((fornecedor) => (
            <Card key={fornecedor.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{fornecedor.nome}</CardTitle>
                    {fornecedor.email && (
                      <CardDescription className="flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {fornecedor.email}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={fornecedor.active ? "default" : "secondary"}>
                    {fornecedor.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {fornecedor.telefone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-3 w-3 mr-2" />
                      {fornecedor.telefone}
                    </div>
                  )}
                  {fornecedor.endereco && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-2" />
                      {fornecedor.endereco}
                    </div>
                  )}
                  {fornecedor.contato && (
                    <div className="flex items-center text-muted-foreground">
                      <Package className="h-3 w-3 mr-2" />
                      Contato: {fornecedor.contato}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Cadastrado em:</span>
                  <span>{new Date(fornecedor.created_at).toLocaleDateString()}</span>
                </div>

                <FornecedorActions 
                  fornecedor={fornecedor} 
                  onEdit={handleEdit} 
                  onRefresh={fetchFornecedores} 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredFornecedores.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {showInactive ? "Nenhum fornecedor inativo encontrado" : "Nenhum fornecedor ativo encontrado"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </OptimizedRoleGuard>
  );
}
