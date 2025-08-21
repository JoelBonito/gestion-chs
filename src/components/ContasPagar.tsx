
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Clock, CheckCircle, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  pagamentos_fornecedor: Array<{
    id: string;
    valor_pagamento: number;
    forma_pagamento: string;
    data_pagamento: string;
    observacoes?: string;
  }>;
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchContasPagar = async () => {
    try {
      console.log("Buscando contas a pagar...");
      
      // Buscar encomendas com seus itens e pagamentos fornecedor
      const { data: encomendasData, error: encomendasError } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total_custo,
          valor_pago_fornecedor,
          saldo_devedor_fornecedor,
          fornecedores!inner(nome),
          itens_encomenda(
            quantidade,
            produtos!inner(preco_custo)
          )
        `)
        .order("created_at", { ascending: false });

      if (encomendasError) {
        console.error("Erro ao buscar encomendas:", encomendasError);
        throw encomendasError;
      }

      console.log("Encomendas encontradas:", encomendasData?.length || 0);

      // Buscar pagamentos de fornecedores separadamente
      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from("pagamentos_fornecedor")
        .select("*");

      if (pagamentosError) {
        console.error("Erro ao buscar pagamentos fornecedor:", pagamentosError);
        // Não vamos falhar se não conseguir buscar pagamentos
      }

      console.log("Pagamentos fornecedor encontrados:", pagamentosData?.length || 0);

      const contasFormatadas = encomendasData?.map((encomenda: any) => {
        // Calcular o valor total de custo dos itens se não estiver definido
        let valorTotalCusto = encomenda.valor_total_custo || 0;
        
        if (valorTotalCusto === 0 && encomenda.itens_encomenda?.length > 0) {
          valorTotalCusto = encomenda.itens_encomenda.reduce((sum: number, item: any) => {
            const precoCusto = parseFloat(item.produtos?.preco_custo || 0);
            return sum + (item.quantidade * precoCusto);
          }, 0);
        }

        // Buscar pagamentos desta encomenda
        const pagamentosFornecedor = pagamentosData?.filter(
          (pagamento: any) => pagamento.encomenda_id === encomenda.id
        ) || [];

        // Calcular valor pago ao fornecedor
        const valorPagoFornecedor = pagamentosFornecedor.reduce((sum: number, pagamento: any) => {
          return sum + parseFloat(pagamento.valor_pagamento || 0);
        }, 0);

        // Calcular saldo devedor
        const saldoDevedorFornecedor = valorTotalCusto - valorPagoFornecedor;

        return {
          encomenda_id: encomenda.id,
          numero_encomenda: encomenda.numero_encomenda,
          fornecedor_nome: encomenda.fornecedores?.nome || "N/A",
          valor_total_custo: valorTotalCusto,
          valor_pago_fornecedor: valorPagoFornecedor,
          saldo_devedor_fornecedor: saldoDevedorFornecedor,
          pagamentos_fornecedor: pagamentosFornecedor.map((p: any) => ({
            id: p.id,
            valor_pagamento: parseFloat(p.valor_pagamento),
            forma_pagamento: p.forma_pagamento,
            data_pagamento: p.data_pagamento,
            observacoes: p.observacoes
          })),
        };
      }) || [];

      console.log("Contas formatadas:", contasFormatadas.length);
      console.log("Primeira conta:", contasFormatadas[0]);

      setContas(contasFormatadas);
    } catch (error: any) {
      console.error("Erro completo:", error);
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

  const handlePagamentoClick = (conta: ContaPagar) => {
    setSelectedConta(conta);
    setPagamentoDialogOpen(true);
  };

  const handlePagamentoSuccess = () => {
    setPagamentoDialogOpen(false);
    setSelectedConta(null);
    fetchContasPagar();
  };

  const filteredContas = contas.filter(
    (conta) =>
      conta.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGeral = contas.reduce((sum, c) => sum + c.valor_total_custo, 0);
  const totalPago = contas.reduce((sum, c) => sum + c.valor_pago_fornecedor, 0);
  const totalAPagar = contas.reduce((sum, c) => sum + c.saldo_devedor_fornecedor, 0);

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
            Valores devidos aos fornecedores por encomenda e controle de pagamentos
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
          {contas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma conta a pagar encontrada. 
                {" "}
                <br />
                Certifique-se de que existem encomendas com itens e fornecedores cadastrados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Encomenda</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor Total (Custo)</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Saldo Devedor</TableHead>
                    <TableHead>Pagamentos</TableHead>
                    <TableHead>Ações</TableHead>
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
                        €{conta.valor_pago_fornecedor.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={conta.saldo_devedor_fornecedor > 0 ? "text-warning" : "text-success"}>
                          €{conta.saldo_devedor_fornecedor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {conta.pagamentos_fornecedor.length > 0 ? (
                            conta.pagamentos_fornecedor.map((pagamento) => (
                              <div key={pagamento.id} className="text-xs text-muted-foreground">
                                €{pagamento.valor_pagamento.toFixed(2)} ({pagamento.forma_pagamento}) - {pagamento.data_pagamento}
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum pagamento</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePagamentoClick(conta)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pagamento
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

      {/* Dialog de Pagamento */}
      <Dialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedConta && (
            <PagamentoFornecedorForm
              onSuccess={handlePagamentoSuccess}
              conta={selectedConta}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
