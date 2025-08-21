import { useState, useEffect } from "react";
import { Search, Filter, Package, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  valor_total: number;
  status_producao: string;
  data_criacao: string;
  data_producao_estimada?: string;
  data_entrega_estimada?: string;
  observacoes?: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

export default function Producao() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(nome),
          fornecedores(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setEncomendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const atualizarStatusProducao = async (encomendaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ status_producao: novoStatus })
        .eq("id", encomendaId);

      if (error) {
        throw error;
      }

      toast.success("Status de produção atualizado!");
      fetchEncomendas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PEDIDO: { label: "Pedido", variant: "secondary" as const, icon: Package },
      PRODUCAO: { label: "Produção", variant: "default" as const, icon: Clock },
      ENTREGA: { label: "Entrega", variant: "outline" as const, icon: Truck }
    };
    return variants[status as keyof typeof variants] || variants.PEDIDO;
  };

  const getStatusCounts = () => {
    return {
      PEDIDO: encomendas.filter(e => e.status_producao === 'PEDIDO').length,
      PRODUCAO: encomendas.filter(e => e.status_producao === 'PRODUCAO').length,
      ENTREGA: encomendas.filter(e => e.status_producao === 'ENTREGA').length,
      total: encomendas.length
    };
  };

  const filteredEncomendas = encomendas.filter(encomenda => {
    const clienteNome = encomenda.clientes?.nome || "";
    const matchesSearch = clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || encomenda.status_producao === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produção</h1>
          <p className="text-muted-foreground">Gerencie o status de produção das encomendas</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.PEDIDO}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produção</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.PRODUCAO}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrega</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.ENTREGA}</div>
          </CardContent>
        </Card>
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
                <SelectItem value="PEDIDO">Pedido</SelectItem>
                <SelectItem value="PRODUCAO">Produção</SelectItem>
                <SelectItem value="ENTREGA">Entrega</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Production Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Controle de Produção</CardTitle>
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Produção</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead>Status Atual</TableHead>
                  <TableHead>Alterar Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando encomendas...
                    </TableCell>
                  </TableRow>
                ) : filteredEncomendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma encomenda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEncomendas.map((encomenda) => {
                    const status = getStatusBadge(encomenda.status_producao);
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={encomenda.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{encomenda.numero_encomenda}</TableCell>
                        <TableCell>{encomenda.clientes?.nome || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {encomenda.fornecedores?.nome || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          € {encomenda.valor_total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {encomenda.data_entrega_estimada ? new Date(encomenda.data_entrega_estimada).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={encomenda.status_producao}
                            onValueChange={(novoStatus) => atualizarStatusProducao(encomenda.id, novoStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PEDIDO">Pedido</SelectItem>
                              <SelectItem value="PRODUCAO">Produção</SelectItem>
                              <SelectItem value="ENTREGA">Entrega</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}