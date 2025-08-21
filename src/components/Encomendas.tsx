
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EncomendaView } from "@/components/EncomendaView";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: StatusEncomenda;
  valor_total: number;
  data_criacao: string;
  data_entrega?: string;
  cliente_nome: string;
  fornecedor_nome: string;
}

export default function Encomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewEncomendaId, setViewEncomendaId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes!inner(nome),
          fornecedores!inner(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = data.map((encomenda: any) => ({
        id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        status: encomenda.status as StatusEncomenda,
        valor_total: parseFloat(encomenda.valor_total || 0),
        data_criacao: encomenda.data_criacao,
        data_entrega: encomenda.data_entrega,
        cliente_nome: encomenda.clientes?.nome || 'N/A',
        fornecedor_nome: encomenda.fornecedores?.nome || 'N/A',
      }));

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      toast.error("Erro ao carregar encomendas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  const handleViewClick = (encomendaId: string) => {
    setViewEncomendaId(encomendaId);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status: StatusEncomenda) => {
    switch (status) {
      case "NOVO PEDIDO": return "bg-gray-500";
      case "PRODUÇÃO": return "bg-blue-500";
      case "EMBALAGEM": return "bg-yellow-500";
      case "TRANSPORTE": return "bg-purple-500";
      case "ENTREGUE": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const filteredEncomendas = encomendas.filter(
    (encomenda) =>
      encomenda.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encomenda.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Gestão de Encomendas</CardTitle>
          <CardDescription>
            Controle completo das encomendas
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar encomendas..."
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncomendas.map((encomenda) => (
                  <TableRow key={encomenda.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {encomenda.numero_encomenda}
                    </TableCell>
                    <TableCell>{encomenda.cliente_nome}</TableCell>
                    <TableCell>{encomenda.fornecedor_nome}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(encomenda.status)} text-white`}>
                        {encomenda.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      €{encomenda.valor_total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(encomenda.data_criacao).toLocaleDateString('pt-PT')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewClick(encomenda.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </div>
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
          {viewEncomendaId && (
            <EncomendaView encomendaId={viewEncomendaId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
