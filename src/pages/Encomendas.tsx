import { useState, useEffect } from "react";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EncomendaForm } from "@/components/EncomendaForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  valor_total: number;
  status: string;
  data_criacao: string;
  data_entrega?: string;
  observacoes?: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

export default function Encomendas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);

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

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchEncomendas();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
  };

  const handleEdit = async (encomenda: Encomenda) => {
    try {
      // Carregar dados completos da encomenda para edição
      const { data: encomendaCompleta, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(id, nome),
          fornecedores(id, nome),
          itens_encomenda(
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            produtos(id, nome, marca, tipo, tamanho, preco_custo)
          )
        `)
        .eq("id", encomenda.id)
        .single();

      if (error) {
        throw error;
      }

      setSelectedEncomenda(encomendaCompleta);
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar encomenda:", error);
      toast.error("Erro ao carregar dados da encomenda");
    }
  };

  const handleView = async (encomenda: Encomenda) => {
    try {
      // Carregar dados completos da encomenda para visualização
      const { data: encomendaCompleta, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(id, nome),
          fornecedores(id, nome),
          itens_encomenda(
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            produtos(id, nome, marca, tipo, tamanho, preco_custo)
          )
        `)
        .eq("id", encomenda.id)
        .single();

      if (error) {
        throw error;
      }

      // Por enquanto, abrir no modo de edição para visualizar
      // Futuramente pode criar um modal específico de visualização
      setSelectedEncomenda(encomendaCompleta);
      setEditDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar encomenda:", error);
      toast.error("Erro ao carregar dados da encomenda");
    }
  };

  const handleDelete = async (encomenda: Encomenda) => {
    if (confirm(`Tem certeza que deseja deletar a encomenda ${encomenda.numero_encomenda}?`)) {
      try {
        // Primeiro deletar os itens da encomenda
        const { error: itemsError } = await supabase
          .from("itens_encomenda")
          .delete()
          .eq("encomenda_id", encomenda.id);

        if (itemsError) throw itemsError;

        // Depois deletar a encomenda
        const { error } = await supabase
          .from("encomendas")
          .delete()
          .eq("id", encomenda.id);

        if (error) throw error;
        
        toast.success("Encomenda deletada com sucesso!");
        fetchEncomendas();
      } catch (error) {
        console.error("Erro ao deletar encomenda:", error);
        toast.error("Erro ao deletar encomenda");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: { label: "Pendente", variant: "secondary" as const },
      enviado: { label: "Enviado", variant: "default" as const },
      entregue: { label: "Entregue", variant: "outline" as const }
    };
    return variants[status as keyof typeof variants] || variants.pendente;
  };

  const filteredEncomendas = encomendas.filter(encomenda => {
    const clienteNome = encomenda.clientes?.nome || "";
    const matchesSearch = clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase());
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Nova Encomenda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Encomenda</DialogTitle>
              <DialogDescription>
                Crie uma nova encomenda para um cliente
              </DialogDescription>
            </DialogHeader>
            <EncomendaForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Encomenda</DialogTitle>
              <DialogDescription>
                Edite as informações da encomenda
              </DialogDescription>
            </DialogHeader>
            <EncomendaForm 
              onSuccess={handleEditSuccess} 
              initialData={selectedEncomenda}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
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
                    const status = getStatusBadge(encomenda.status);
                    return (
                      <TableRow key={encomenda.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{encomenda.numero_encomenda}</TableCell>
                        <TableCell>{encomenda.clientes?.nome || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {encomenda.fornecedores?.nome || "N/A"}
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-sm">
                          {encomenda.observacoes || "Sem descrição"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          € {encomenda.valor_total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {encomenda.data_entrega ? new Date(encomenda.data_entrega).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleView(encomenda)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(encomenda)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(encomenda)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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