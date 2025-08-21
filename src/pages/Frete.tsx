
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Truck, Settings, Search, Scale, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { logActivity } from "@/utils/activityLogger";

interface FreightRate {
  id: string;
  origin: string;
  destination: string;
  currency: string;
  rate_per_kg: number;
  active: boolean;
}

interface Encomenda {
  id: string;
  numero_encomenda: string;
  valor_total: number;
  status: string;
  data_criacao: string;
  clientes?: { nome: string };
}

export default function Frete() {
  const [freightRates, setFreightRates] = useState<FreightRate[]>([]);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [filteredEncomendas, setFilteredEncomendas] = useState<Encomenda[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedOrder, setSelectedOrder] = useState<Encomenda | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasRole, canEdit } = useUserRole();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = encomendas.filter(encomenda => {
      const matchesSearch = encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           encomenda.clientes?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || encomenda.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredEncomendas(filtered);
  }, [encomendas, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      // Set default freight rates since table doesn't exist yet
      setFreightRates([{
        id: "default",
        origin: "São Paulo",
        destination: "Marselha",
        currency: "EUR",
        rate_per_kg: 4.5,
        active: true
      }]);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total,
          status,
          data_criacao,
          clientes(nome)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        setEncomendas(ordersData as Encomenda[]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = "EUR") => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de frete...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Gestão de Frete
          </h1>
          <p className="text-muted-foreground">Gerencie cálculos de frete e tarifas de transporte</p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tarifas
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Por Encomenda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Frete
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOrder ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Encomenda</label>
                        <Input value={selectedOrder.numero_encomenda} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cliente</label>
                        <Input value={selectedOrder.clientes?.nome || "N/A"} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Peso Estimado</label>
                        <Input value={formatWeight(5.0)} readOnly />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          Multiplicador de Peso
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue="1.3"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Peso Ajustado</label>
                        <Input 
                          value={formatWeight(6.5)} 
                          readOnly 
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Tarifa por Kg (€)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue="4.50"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Valor do Frete</h3>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(29.25)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecione uma encomenda na aba "Por Encomenda" para calcular o frete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tarifas de Frete
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasRole('admin') || hasRole('finance') ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Moeda</TableHead>
                        <TableHead>Tarifa por Kg</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {freightRates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>{rate.origin}</TableCell>
                          <TableCell>{rate.destination}</TableCell>
                          <TableCell>{rate.currency}</TableCell>
                          <TableCell>{formatCurrency(rate.rate_per_kg, rate.currency)}</TableCell>
                          <TableCell>
                            <Badge variant={rate.active ? "default" : "secondary"}>
                              {rate.active ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Você precisa de permissão de administrador ou financeiro para gerenciar tarifas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Frete por Encomenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por encomenda ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Encomenda</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Peso Estimado</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEncomendas.map((encomenda) => (
                    <TableRow key={encomenda.id}>
                      <TableCell className="font-medium">{encomenda.numero_encomenda}</TableCell>
                      <TableCell>{encomenda.clientes?.nome || "N/A"}</TableCell>
                      <TableCell>{formatWeight(5.0)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(encomenda.valor_total)}</TableCell>
                      <TableCell>
                        <Badge variant={encomenda.status === "pendente" ? "secondary" : "default"}>
                          {encomenda.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(encomenda)}
                        >
                          Calcular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
