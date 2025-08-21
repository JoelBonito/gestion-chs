import { useState } from "react";
import { Plus, Search, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClienteForm } from "@/components/ClienteForm";

// Mock data
const clientes = [
  {
    id: 1,
    nome: "Distribuidora Alpha",
    email: "contato@alpha.com",
    telefone: "(11) 9999-1111",
    endereco: "São Paulo, SP",
    totalCompras: 25600.00,
    ultimaCompra: "2024-01-15",
    status: "ativo",
    encomendasAbertas: 2
  },
  {
    id: 2,
    nome: "Cosméticos Beta",
    email: "vendas@beta.com",
    telefone: "(21) 8888-2222",
    endereco: "Rio de Janeiro, RJ",
    totalCompras: 18900.00,
    ultimaCompra: "2024-01-14",
    status: "ativo",
    encomendasAbertas: 1
  },
  {
    id: 3,
    nome: "Beauty Gamma",
    email: "compras@gamma.com",
    telefone: "(31) 7777-3333",
    endereco: "Belo Horizonte, MG",
    totalCompras: 32100.00,
    ultimaCompra: "2024-01-13",
    status: "ativo",
    encomendasAbertas: 0
  },
  {
    id: 4,
    nome: "Hair Delta",
    email: "pedidos@delta.com",
    telefone: "(41) 6666-4444",
    endereco: "Curitiba, PR",
    totalCompras: 12300.00,
    ultimaCompra: "2024-01-12",
    status: "inativo",
    encomendasAbertas: 1
  }
];

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === "ativo" 
      ? { label: "Ativo", variant: "default" as const }
      : { label: "Inativo", variant: "secondary" as const };
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
            <ClienteForm onSuccess={() => setDialogOpen(false)} />
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClientes.map((cliente) => {
          const status = getStatusBadge(cliente.status);
          return (
            <Card key={cliente.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {cliente.email}
                    </CardDescription>
                  </div>
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-3 w-3 mr-2" />
                    {cliente.telefone}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-2" />
                    {cliente.endereco}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      R$ {(cliente.totalCompras / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">Total Compras</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      {cliente.encomendasAbertas}
                    </p>
                    <p className="text-xs text-muted-foreground">Encomendas Abertas</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Última compra:</span>
                  <span>{cliente.ultimaCompra}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Detalhes
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