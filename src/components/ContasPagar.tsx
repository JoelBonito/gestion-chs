
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoFornecedorForm from "@/components/PagamentoFornecedorForm";

interface ContaPagar {
  encomenda_id: string;
  numero_encomenda: string;
  fornecedor_nome: string;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor: number;
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [showPagamentoForm, setShowPagamentoForm] = useState(false);
  const { toast } = useToast();

  const fetchContas = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          fornecedores!inner(nome)
        `)
        .gt("saldo_devedor_fornecedor", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contasFormatadas = data.map((encomenda: any) => ({
        encomenda_id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        fornecedor_nome: encomenda.fornecedores.nome,
        valor_total_custo: parseFloat(encomenda.valor_total_custo || 0),
        valor_pago_fornecedor: parseFloat(encomenda.valor_pago_fornecedor || 0),
        saldo_devedor_fornecedor: parseFloat(encomenda.saldo_devedor_fornecedor || 0),
      }));

      setContas(contasFormatadas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas a pagar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const handlePagamentoSuccess = () => {
    fetchContas();
    setShowPagamentoForm(false);
    setSelectedConta(null);
  };

  if (isLoading) {
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
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Contas a Pagar - Fornecedores
          </CardTitle>
          <CardDescription>
            Encomendas com saldo devedor para fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encomenda</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta) => (
                  <TableRow key={conta.encomenda_id}>
                    <TableCell className="font-medium">
                      {conta.numero_encomenda}
                    </TableCell>
                    <TableCell>{conta.fornecedor_nome}</TableCell>
                    <TableCell>€{conta.valor_total_custo.toFixed(2)}</TableCell>
                    <TableCell>€{conta.valor_pago_fornecedor.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-warning">
                      €{conta.saldo_devedor_fornecedor.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConta(conta);
                          setShowPagamentoForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {contas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma conta a pagar encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      {selectedConta && (
        <Dialog open={showPagamentoForm} onOpenChange={setShowPagamentoForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pagamento ao Fornecedor</DialogTitle>
            </DialogHeader>
            <PagamentoFornecedorForm
              onSuccess={handlePagamentoSuccess}
              conta={selectedConta}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
