import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  status: string;
  data_criacao: string;
  data_entrega: string;
  pagamentos: Array<{
    id: string;
    valor_pagamento: number;
    forma_pagamento: string;
    data_pagamento: string;
    observacoes?: string;
  }>;
}

interface EncomendasFinanceiroProps {
  onSelectEncomenda?: (encomenda: Encomenda) => void;
}

export default function EncomendasFinanceiro({ onSelectEncomenda }: EncomendasFinanceiroProps) {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes!inner(nome),
          pagamentos(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = data.map((encomenda: any) => ({
        id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        cliente_nome: encomenda.clientes.nome,
        valor_total: parseFloat(encomenda.valor_total),
        valor_pago: parseFloat(encomenda.valor_pago),
        saldo_devedor: parseFloat(encomenda.saldo_devedor),
        status: encomenda.status,
        data_criacao: encomenda.data_criacao,
        data_entrega: encomenda.data_entrega,
        pagamentos: encomenda.pagamentos || [],
      }));

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar encomendas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const getStatusBadge = (saldoDevedor: number) => {
    if (saldoDevedor <= 0) {
      return { label: "Pago", variant: "outline" as const, icon: CheckCircle };
    }
    return { label: "Pendente", variant: "secondary" as const, icon: Clock };
  };

  const filteredEncomendas = encomendas.filter(
    (encomenda) =>
      encomenda.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAPagar = encomendas.reduce((sum, e) => sum + e.saldo_devedor, 0);
  const totalPago = encomendas.reduce((sum, e) => sum + e.valor_pago, 0);
  const totalGeral = encomendas.reduce((sum, e) => sum + e.valor_total, 0);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando encomendas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Geral</p>
                <p className="text-lg font-bold">€{totalGeral.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium">Total Pago</p>
                <p className="text-lg font-bold text-success">€{totalPago.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium">A Receber</p>
                <p className="text-lg font-bold text-warning">€{totalAPagar.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Encomendas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Encomendas e Pagamentos</CardTitle>
          <CardDescription>
            Visualize o status financeiro de cada encomenda
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou número da encomenda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Encomenda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncomendas.map((encomenda) => {
                  const status = getStatusBadge(encomenda.saldo_devedor);
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={encomenda.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {encomenda.numero_encomenda}
                      </TableCell>
                      <TableCell>{encomenda.cliente_nome}</TableCell>
                      <TableCell className="font-semibold">
                        €{encomenda.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-success font-semibold">
                        €{encomenda.valor_pago.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={encomenda.saldo_devedor > 0 ? "text-warning" : "text-success"}>
                          €{encomenda.saldo_devedor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {encomenda.pagamentos.length > 0 ? (
                            encomenda.pagamentos.map((pagamento) => (
                              <div key={pagamento.id} className="text-xs text-muted-foreground">
                                €{pagamento.valor_pagamento.toFixed(2)} ({pagamento.forma_pagamento}) - {pagamento.data_pagamento}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum pagamento</span>
                          )}
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