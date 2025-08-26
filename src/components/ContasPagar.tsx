import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoFornecedorForm from "./PagamentoFornecedorForm";
import type { ContaPagar } from "@/types/financeiro";

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const { toast } = useToast();

  const fetchContas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total_custo,
          valor_pago_fornecedor,
          valor_frete,
          fornecedores(id, nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contasFormatadas: ContaPagar[] = (data ?? []).map((e: any) => {
        const valorCusto = Number(e.valor_total_custo || 0);
        const valorFrete = Number(e.valor_frete || 0);
        const valorPagoFornecedor = Number(e.valor_pago_fornecedor || 0);
        
        // CORRIGIDO: A PAGAR = Valor do custo + Valor do frete
        const totalFornecedor = valorCusto + valorFrete;
        const saldoDevedorTotal = Math.max(0, totalFornecedor - valorPagoFornecedor);
        
        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          fornecedor_nome: e.fornecedores?.nome || '',
          valor_total_custo: valorCusto,
          valor_pago_fornecedor: valorPagoFornecedor,
          saldo_devedor_fornecedor: Math.max(0, valorCusto - valorPagoFornecedor),
          valor_frete: valorFrete,
          total_fornecedor: totalFornecedor,
          saldo_devedor_fornecedor_total: saldoDevedorTotal,
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
    fetchContas();
  }, []);

  const handlePagamentoSuccess = () => {
    setShowPagamentoDialog(false);
    setSelectedConta(null);
    fetchContas();
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            A pagar = Valor do custo + Valor do frete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma conta encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                <div>Encomenda</div>
                <div>Fornecedor</div>
                <div className="text-right">Custo</div>
                <div className="text-right">Frete</div>
                <div className="text-right">Total a Pagar</div>
                <div className="text-right">Pago</div>
                <div className="text-right">Saldo</div>
                <div className="text-center">Ações</div>
              </div>

              {/* Rows */}
              {contas.map((conta) => {
                const hasPendingBalance = conta.saldo_devedor_fornecedor_total > 0;
                return (
                  <div 
                    key={conta.id} 
                    className={`grid grid-cols-8 gap-4 items-center py-3 border-b hover:bg-gray-50 ${
                      hasPendingBalance ? 'bg-red-50' : 'bg-green-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{conta.numero_encomenda}</p>
                      {hasPendingBalance && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm">{conta.fornecedor_nome}</div>
                    
                    <div className="text-right text-sm">
                      €{conta.valor_total_custo.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm">
                      €{conta.valor_frete.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm font-medium">
                      €{conta.total_fornecedor.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm text-green-600">
                      €{conta.valor_pago_fornecedor.toFixed(2)}
                    </div>
                    
                    <div className={`text-right text-sm font-bold ${
                      hasPendingBalance ? 'text-red-600' : 'text-green-600'
                    }`}>
                      €{conta.saldo_devedor_fornecedor_total.toFixed(2)}
                    </div>
                    
                    <div className="text-center">
                      {hasPendingBalance ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedConta(conta);
                            setShowPagamentoDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Pagar
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Pago
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPagamentoDialog} onOpenChange={setShowPagamentoDialog}>
        <DialogContent className="max-w-2xl">
          {selectedConta && (
            <PagamentoFornecedorForm 
              onSuccess={handlePagamentoSuccess}
              conta={{
                encomenda_id: selectedConta.id,
                numero_encomenda: selectedConta.numero_encomenda,
                fornecedor_nome: selectedConta.fornecedor_nome,
                valor_total_custo: selectedConta.valor_total_custo,
                valor_pago_fornecedor: selectedConta.valor_pago_fornecedor,
                saldo_devedor_fornecedor: selectedConta.saldo_devedor_fornecedor_total,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
