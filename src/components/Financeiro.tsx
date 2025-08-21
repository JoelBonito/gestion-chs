
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EncomendaView } from "@/components/EncomendaView";
import StatCard from "@/components/StatCard";

interface FinanceiroItem {
  encomenda_id: string;
  numero_encomenda: string;
  cliente_nome: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor: number;
  data_criacao: string;
}

export default function Financeiro() {
  const [items, setItems] = useState<FinanceiroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewEncomendaId, setViewEncomendaId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes!inner(nome)
        `)
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
    } catch (error: any) {
      toast.error("Erro ao carregar dados financeiros: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewClick = (encomendaId: string) => {
    setViewEncomendaId(encomendaId);
    setViewDialogOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Geral"
          value={`€${totalGeral.toFixed(2)}`}
          subtitle="Valor total das encomendas"
          icon={<DollarSign className="h-6 w-6" />}
          variant="default"
        />
        
        <StatCard
          title="Total Pago"
          value={`€${totalPago.toFixed(2)}`}
          subtitle="Pagamentos realizados"
          icon={<CheckCircle className="h-6 w-6" />}
          variant="success"
        />
        
        <StatCard
          title="A Receber"
          value={`€${totalSaldo.toFixed(2)}`}
          subtitle="Pendente de recebimento"
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Controle Financeiro</CardTitle>
          <CardDescription>Gestão financeira das encomendas</CardDescription>
          
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Encomenda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
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
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewEncomendaId && <EncomendaView encomendaId={viewEncomendaId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
