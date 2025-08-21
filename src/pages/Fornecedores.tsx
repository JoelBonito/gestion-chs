import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FornecedorForm } from "@/components/FornecedorForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  contato?: string;
  created_at: string;
}

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

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

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fornecedor.email && fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = () => {
    return { label: "Ativo", variant: "default" as const };
  };

  return (
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

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar fornecedor por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredFornecedores.map((fornecedor) => {
            const status = getStatusBadge();
            return (
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
                    <Badge variant={status.variant}>
                      {status.label}
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

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Catálogo
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredFornecedores.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}