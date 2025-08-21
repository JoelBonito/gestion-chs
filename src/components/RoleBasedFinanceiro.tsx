
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle, CreditCard, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { EncomendaView } from "@/components/EncomendaView";
import { EncomendaViewCusto } from "@/components/EncomendaViewCusto";
import StatCard from "@/components/StatCard";

interface FinanceiroItem {
  encomenda_id: string;
  numero_encomenda: string;
  cliente_nome?: string;
  fornecedor_nome?: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  data_criacao: string;
}

export default function RoleBasedFinanceiro() {
  const [items, setItems] = useState<FinanceiroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewEncomendaId, setViewEncomendaId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { hasRole } = useUserRole();

  const isFactory = hasRole('factory');
  const isClient = hasRole('client');

  const fetchData = async () => {
    try {
      if (isFactory) {
        // Para fornecedor (factory): mostrar contas a pagar
        const { data: encomendasData, error: encomendasError } = await supabase
          .from("encomendas")
          .select(`
            id,
            numero_encomenda,
            valor_total_custo,
            valor_pago_fornecedor,
            saldo_devedor_fornecedor,
            data_criacao,
            clientes!inner(nome),
            itens_encomenda(
              quantidade,
              produtos!inner(preco_custo)
            )
          `)
          .order("created_at", { ascending: false });

        if (encomendasError) throw encomendasError;

        const itemsFormatados = encomendasData?.map((encomenda: any) => {
          let valorTotalCusto = encomenda.valor_total_custo || 0;
          
          if (valorTotalCusto === 0 && encomenda.itens_encomenda?.length > 0) {
            valorTotalCusto = encomenda.itens_encomenda.reduce((sum: number, item: any) => {
              const precoCusto = parseFloat(item.produtos?.preco_custo || 0);
              return sum + (item.quantidade * precoCusto);
            }, 0);
          }

          return {
            encomenda_id: encomenda.id,
            numero_encomenda: encomenda.numero_encomenda,
            cliente_nome: encomenda.clientes?.nome || 'N/A',
            valor_total: valorTotalCusto,
            valor_pago: encomenda.valor_pago_fornecedor || 0,
            saldo_devedor: valorTotalCusto - (encomenda.valor_pago_fornecedor || 0),
            data_criacao: encomenda.data_criacao,
          };
        }) || [];

        setItems(itemsFormatados);
      } else if (isClient) {
        // Para cliente: mostrar contas a receber
        const { data, error } = await supabase
          .from("encomendas")
          .select(`
            *,
            clientes!inner(nome)
          `)
          .gt("saldo_devedor", 0)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const itemsFormatados = data.map((encomenda: any) => ({
          encomenda_id: encomenda.id,
          numero_encomenda: encomenda.numero_encomenda,
          cliente_nome: encomenda.clientes.nome,
          valor_total: parseFloat(encomenda.valor_total),
          valor_pago: parseFloat(encomenda.valor_pago),
          saldo_devedor: parseFloat(encomenda.saldo_devedor),
          data_criacao: encomenda.data_criacao,
        }));

        setItems(itemsFormatados);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados financeiros: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isFactory, isClient]);

  const handleViewClick = (encomendaId: string) => {
    setViewEncomendaId(encomendaId);
    setViewDialogOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      (item.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (item.fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      item.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGeral = items.reduce((sum, i) => sum + i.valor_total, 0);
  const totalPago = items.reduce((sum, i) => sum + i.valor_pago, 0);
  const totalSaldo = items.reduce((sum, i) => sum + i.saldo_devedor, 0);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Geral"
          value={`€${totalGeral.toFixed(2)}`}
          subtitle={isFactory ? "Valor total de custos" : "Valor total das encomendas"}
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
        
        <StatCard
          title={isFactory ? "Total Recebido" : "Total Pago"}
          value={`€${totalPago.toFixed(2)}`}
          subtitle={isFactory ? "Pagamentos recebidos" : "Pagamentos realizados"}
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title={isFactory ? "A Receber" : "A Pagar"}
          value={`€${totalSaldo.toFixed(2)}`}
          subtitle={isFactory ? "Pendente de recebimento" : "Pendente de pagamento"}
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      {/* Lista de Itens Financeiros */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            {isFactory ? "Contas a Receber" : "Contas a Pagar"}
          </CardTitle>
          <CardDescription>
            {isFactory ? 
              "Valores a receber por encomenda" : 
              "Valores pendentes de pagamento"
            }
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por encomenda ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum item financeiro encontrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Encomenda</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>{isFactory ? "Valor Recebido" : "Valor Pago"}</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.encomenda_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {item.numero_encomenda}
                      </TableCell>
                      <TableCell>{item.cliente_nome}</TableCell>
                      <TableCell className="font-semibold">
                        €{item.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-success font-semibold">
                        €{item.valor_pago.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={item.saldo_devedor > 0 ? "text-warning" : "text-success"}>
                          €{item.saldo_devedor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(item.data_criacao).toLocaleDateString('pt-PT')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewClick(item.encomenda_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewEncomendaId && (
            isFactory ? (
              <EncomendaViewCusto encomendaId={viewEncomendaId} />
            ) : (
              <EncomendaView encomendaId={viewEncomendaId} />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
