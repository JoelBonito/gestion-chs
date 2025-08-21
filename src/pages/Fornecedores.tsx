import { useState } from "react";
import { Plus, Search, Phone, Mail, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data
const fornecedores = [
  {
    id: 1,
    nome: "Fábrica Premium Hair",
    email: "vendas@premiumhair.com",
    telefone: "(11) 3333-1111",
    endereco: "São Paulo, SP",
    cnpj: "12.345.678/0001-90",
    totalCompras: 45600.00,
    ultimaCompra: "2024-01-15",
    status: "ativo",
    encomendasAbertas: 3,
    prazoEntrega: "7-10 dias",
    especialidade: "Produtos Hidratantes"
  },
  {
    id: 2,
    nome: "Indústria Capilar Pro",
    email: "comercial@capilar.com",
    telefone: "(21) 4444-2222",
    endereco: "Rio de Janeiro, RJ",
    cnpj: "98.765.432/0001-10",
    totalCompras: 32100.00,
    ultimaCompra: "2024-01-14",
    status: "ativo",
    encomendasAbertas: 2,
    prazoEntrega: "5-7 dias",
    especialidade: "Tratamento Intensivo"
  }
];

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie suas fábricas e parceiros de produção</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
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
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredFornecedores.map((fornecedor) => {
          const status = getStatusBadge(fornecedor.status);
          return (
            <Card key={fornecedor.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{fornecedor.nome}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {fornecedor.email}
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
                    {fornecedor.telefone}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-2" />
                    {fornecedor.endereco}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Package className="h-3 w-3 mr-2" />
                    {fornecedor.especialidade}
                  </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="font-medium">{fornecedor.cnpj}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prazo Entrega:</span>
                    <span className="font-medium">{fornecedor.prazoEntrega}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      R$ {(fornecedor.totalCompras / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">Total Compras</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      {fornecedor.encomendasAbertas}
                    </p>
                    <p className="text-xs text-muted-foreground">Encomendas Abertas</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Última compra:</span>
                  <span>{fornecedor.ultimaCompra}</span>
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