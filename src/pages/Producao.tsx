import { useState, useEffect } from "react";
import { Search, Filter, Package, Clock, Truck, CalendarIcon, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ItemEncomenda {
  id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produtos?: { nome: string; marca: string; tipo: string };
}

interface Encomenda {
  id: string;
  numero_encomenda: string;
  valor_total: number;
  status_producao: string;
  data_criacao: string;
  data_producao_estimada?: string;
  data_envio_estimada?: string;
  observacoes?: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

export default function Producao() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [itensEncomenda, setItensEncomenda] = useState<ItemEncomenda[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

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

  const atualizarDataProducao = async (encomendaId: string, novaData: Date | undefined) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ data_producao_estimada: novaData ? format(novaData, "yyyy-MM-dd") : null })
        .eq("id", encomendaId);

      if (error) {
        throw error;
      }

      toast.success("Data de produção atualizada!");
      fetchEncomendas();
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  const atualizarDataEnvio = async (encomendaId: string, novaData: Date | undefined) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ data_envio_estimada: novaData ? format(novaData, "yyyy-MM-dd") : null })
        .eq("id", encomendaId);

      if (error) {
        throw error;
      }

      toast.success("Data de envio atualizada!");
      fetchEncomendas();
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  const fetchItensEncomenda = async (encomendaId: string) => {
    setLoadingItens(true);
    console.log("Buscando itens para encomenda:", encomendaId);
    try {
      const { data, error } = await supabase
        .from("itens_encomenda")
        .select(`
          *,
          produtos!inner(nome, marca, tipo)
        `)
        .eq("encomenda_id", encomendaId);

      if (error) {
        console.error("Erro na query dos itens:", error);
        throw error;
      }

      console.log("Itens encontrados:", data);
      setItensEncomenda(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens da encomenda:", error);
      toast.error("Erro ao carregar itens da encomenda");
    } finally {
      setLoadingItens(false);
    }
  };

  const handleVerEncomenda = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    fetchItensEncomenda(encomenda.id);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Produção</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie o status de produção das encomendas</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.PEDIDO}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produção</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.PRODUCAO}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
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
      <Card className="shadow-card bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background dark:bg-popover"
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
      <Card className="shadow-card bg-card">
        <CardHeader>
          <CardTitle>Controle de Produção</CardTitle>
          <CardDescription>
            {filteredEncomendas.length} encomenda(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[150px]">Fornecedor</TableHead>
                    <TableHead className="w-[100px] text-right">Valor</TableHead>
                    <TableHead className="w-[140px] text-center">Data Produção</TableHead>
                    <TableHead className="w-[140px] text-center">Data Envio</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                    <TableHead className="w-[50px] text-center">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="bg-background dark:bg-popover">
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
                          <TableCell className="font-medium w-[100px]">{encomenda.numero_encomenda}</TableCell>
                          <TableCell className="min-w-[150px]">{encomenda.clientes?.nome || "N/A"}</TableCell>
                          <TableCell className="min-w-[150px] text-sm text-muted-foreground">
                            {encomenda.fornecedores?.nome || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold text-right w-[100px] whitespace-nowrap">
                            €{encomenda.valor_total.toFixed(2)}
                          </TableCell>
                          <TableCell className="w-[140px]">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal text-xs",
                                    !encomenda.data_producao_estimada && "text-muted-foreground"
                                  )}
                                  size="sm"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {encomenda.data_producao_estimada
                                      ? format(new Date(encomenda.data_producao_estimada), "dd/MM/yy")
                                      : "Definir"
                                    }
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined}
                                  onSelect={(date) => atualizarDataProducao(encomenda.id, date)}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="w-[140px]">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal text-xs",
                                    !encomenda.data_envio_estimada && "text-muted-foreground"
                                  )}
                                  size="sm"
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {encomenda.data_envio_estimada
                                      ? format(new Date(encomenda.data_envio_estimada), "dd/MM/yy")
                                      : "Definir"
                                    }
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined}
                                  onSelect={(date) => atualizarDataEnvio(encomenda.id, date)}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <div className="flex justify-center">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Badge
                                    variant={status.variant}
                                    className="flex items-center gap-1 w-fit text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                                  >
                                    <StatusIcon className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{status.label}</span>
                                  </Badge>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                  <div className="p-2">
                                    <Select
                                      value={encomenda.status_producao}
                                      onValueChange={(novoStatus) => atualizarStatusProducao(encomenda.id, novoStatus)}
                                    >
                                      <SelectTrigger className="w-full text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PEDIDO">Pedido</SelectItem>
                                        <SelectItem value="PRODUCAO">Produção</SelectItem>
                                        <SelectItem value="ENTREGA">Entrega</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </TableCell>
                          <TableCell className="w-[50px]">
                            <div className="flex justify-center">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                    onClick={() => handleVerEncomenda(encomenda)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detalhes da Encomenda {encomenda.numero_encomenda}</DialogTitle>
                                    <DialogDescription>
                                      Visualize todas as informações da encomenda e seus produtos
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    {selectedEncomenda && (
                                      <>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                                            <p className="text-sm">{selectedEncomenda.clientes?.nome || "N/A"}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Fornecedor</label>
                                            <p className="text-sm">{selectedEncomenda.fornecedores?.nome || "N/A"}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                                            <p className="text-sm font-semibold">€{selectedEncomenda.valor_total.toFixed(2)}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <p className="text-sm">{getStatusBadge(selectedEncomenda.status_producao).label}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Data Criação</label>
                                            <p className="text-sm">{format(new Date(selectedEncomenda.data_criacao), "dd/MM/yyyy")}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Data Produção</label>
                                            <p className="text-sm">
                                              {selectedEncomenda.data_producao_estimada
                                                ? format(new Date(selectedEncomenda.data_producao_estimada), "dd/MM/yyyy")
                                                : "Não definida"
                                              }
                                            </p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Data Envio</label>
                                            <p className="text-sm">
                                              {selectedEncomenda.data_envio_estimada
                                                ? format(new Date(selectedEncomenda.data_envio_estimada), "dd/MM/yyyy")
                                                : "Não definida"
                                              }
                                            </p>
                                          </div>
                                          {selectedEncomenda.observacoes && (
                                            <div className="col-span-full">
                                              <label className="text-sm font-medium text-muted-foreground">Observações</label>
                                              <p className="text-sm">{selectedEncomenda.observacoes}</p>
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <h3 className="text-lg font-semibold mb-4">Itens da Encomenda</h3>
                                          {loadingItens ? (
                                            <div className="text-center py-4">Carregando itens...</div>
                                          ) : itensEncomenda.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                              <p>Nenhum produto encontrado para esta encomenda</p>
                                              <p className="text-xs mt-1">Os produtos devem ser adicionados ao criar/editar a encomenda</p>
                                            </div>
                                          ) : (
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead>Produto</TableHead>
                                                  <TableHead>Marca</TableHead>
                                                  <TableHead>Tipo</TableHead>
                                                  <TableHead className="text-right">Qtd</TableHead>
                                                  <TableHead className="text-right">Preço Unit.</TableHead>
                                                  <TableHead className="text-right">Subtotal</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {itensEncomenda.map((item) => (
                                                  <TableRow key={item.id}>
                                                    <TableCell>{item.produtos?.nome || "N/A"}</TableCell>
                                                    <TableCell>{item.produtos?.marca || "N/A"}</TableCell>
                                                    <TableCell>{item.produtos?.tipo || "N/A"}</TableCell>
                                                    <TableCell className="text-right">{item.quantidade}</TableCell>
                                                    <TableCell className="text-right">€{item.preco_unitario.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-semibold">€{item.subtotal.toFixed(2)}</TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
