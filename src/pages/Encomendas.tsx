import { useState } from "react";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data
const encomendas = [
  {
    id: "ENV-001",
    cliente: "Distribuidora Alpha",
    fornecedor: "Fábrica Premium Hair",
    produtos: "Shampoo Hidratante (50un), Condicionador (30un)",
    valor: 2500.00,
    status: "pendente",
    dataCriacao: "2024-01-15",
    dataEntrega: "2024-01-25"
  },
  {
    id: "ENV-002",
    cliente: "Cosméticos Beta",
    fornecedor: "Indústria Capilar Pro",
    produtos: "Máscara Nutritiva (25un), Óleo Reparador (15un)",
    valor: 1800.00,
    status: "enviado",
    dataCriacao: "2024-01-14",
    dataEntrega: "2024-01-22"
  },
  {
    id: "ENV-003",
    cliente: "Beauty Gamma",
    fornecedor: "Fábrica Premium Hair",
    produtos: "Kit Completo Capilar (20un)",
    valor: 3200.00,
    status: "entregue",
    dataCriacao: "2024-01-13",
    dataEntrega: "2024-01-20"
  },
  {
    id: "ENV-004",
    cliente: "Hair Delta",
    fornecedor: "Indústria Capilar Pro",
    produtos: "Creme para Pentear (40un)",
    valor: 950.00,
    status: "pendente",
    dataCriacao: "2024-01-12",
    dataEntrega: "2024-01-28"
  }
];

export default function Encomendas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: { label: "Pendente", variant: "secondary" as const },
      enviado: { label: "Enviado", variant: "default" as const },
      entregue: { label: "Entregue", variant: "outline" as const }
    };
    return variants[status as keyof typeof variants] || variants.pendente;
  };

  const filteredEncomendas = encomendas.filter(encomenda => {
    const matchesSearch = encomenda.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         encomenda.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || encomenda.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gerencie todas as encomendas dos seus clientes</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          Nova Encomenda
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Encomendas</CardTitle>
          <CardDescription>
            {filteredEncomendas.length} encomenda(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncomendas.map((encomenda) => {
                  const status = getStatusBadge(encomenda.status);
                  return (
                    <TableRow key={encomenda.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{encomenda.id}</TableCell>
                      <TableCell>{encomenda.cliente}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {encomenda.fornecedor}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm">
                        {encomenda.produtos}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {encomenda.valor.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {encomenda.dataEntrega}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}