
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  valor_total_custo: number;
  valor_pago: number;
  saldo_devedor: number;
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchContasPagar = async () => {
    try {
      // Buscar encomendas com seus itens e calcular o valor total de custo
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_pago,
          fornecedores!inner(nome),
          itens_encomenda(
            quantidade,
            produtos!inner(preco_custo)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contasFormatadas = data.map((encomenda: any) => {
        // Calcular o valor total de custo dos itens
        const valorTotalCusto = encomenda.itens_encomenda.reduce((sum: number, item: any) => {
          return sum + (item.quantidade * parseFloat(item.produtos.preco_custo));
        }, 0);

        return {
          encomenda_id: encomenda.id,
          numero_encomenda: encomenda.numero_encomenda,
          fornecedor_nome: encomenda.fornecedores.nome,
          valor_total_custo: valorTotalCusto,
          valor_pago: 0, // Por enquanto, assumindo que não há pagamentos para fornecedores
          saldo_devedor: valorTotalCusto,
        };
      });

      setContas(contasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas a pagar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContasPagar();
  }, []);

  const filteredContas = contas.filter(
    (conta) =>
      conta.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGeral = contas.reduce((sum, c) => sum + c.valor_total_custo, 0);
  const totalPago = contas.reduce((sum, c) => sum + c.valor_pago, 0);
  const totalAPagar = contas.reduce((sum, c) => sum + c.saldo_devedor, 0);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando contas a pagar...</p>
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
                <p className="text-sm font-medium">Por Pagar</p>
                <p className="text-lg font-bold text-warning">€{totalAPagar.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas a Pagar */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Valores devidos aos fornecedores por encomenda
          </CardDescription>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por fornecedor ou número da encomenda..."
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor Total (Custo)</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.map((conta) => (
                  <TableRow key={conta.encomenda_id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {conta.numero_encomenda}
                    </TableCell>
                    <TableCell>{conta.fornecedor_nome}</TableCell>
                    <TableCell className="font-semibold">
                      €{conta.valor_total_custo.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-success font-semibold">
                      €{conta.valor_pago.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <span className={conta.saldo_devedor > 0 ? "text-warning" : "text-success"}>
                        €{conta.saldo_devedor.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
