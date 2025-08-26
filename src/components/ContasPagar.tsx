
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
      
      // Buscar encomendas com itens e produtos para calcular custo real
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_pago_fornecedor,
          freight_rates,
          fornecedores(id, nome),
          itens_encomenda(
            quantidade,
            produtos(preco_custo)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contasFormatadas: ContaPagar[] = (data ?? []).map((e: any) => {
        // Calcular custo real dos produtos
        const custoProducts = (e.itens_encomenda || []).reduce((total: number, item: any) => {
          const quantidade = Number(item.quantidade || 0);
          const precoCusto = Number(item.produtos?.preco_custo || 0);
          return total + (quantidade * precoCusto);
        }, 0);
        
        const frete = Number(e.freight_rates || 0);
        const pagoFornecedor = Number(e.valor_pago_fornecedor || 0);
        
        const totalCaixaPagar = custoProducts + frete;
        const saldoPagarCaixa = Math.max(totalCaixaPagar - pagoFornecedor, 0);
        
        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          fornecedor_nome: e.fornecedores?.nome || '',
          custo_produtos: custoProducts,
          valor_pago_fornecedor: pagoFornecedor,
          freight_rates: frete,
          total_caixa_pagar: totalCaixaPagar,
          saldo_pagar_caixa: saldoPagarCaixa,
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
            Total (Caixa) = Custo dos produtos + Valor do frete
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
              <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                <div>Encomenda</div>
                <div>Fornecedor</div>
                <div className="text-right">Custo Produtos</div>
                <div className="text-right">Frete</div>
                <div className="text-right">Total (Caixa)</div>
                <div className="text-right">Pago Fornecedor</div>
                <div className="text-right">Saldo (Caixa)</div>
              </div>

              {/* Rows */}
              {contas.map((conta) => {
                const hasPendingBalance = conta.saldo_pagar_caixa > 0;
                return (
                  <div 
                    key={conta.id} 
                    className={`grid grid-cols-7 gap-4 items-center py-3 border-b hover:bg-gray-50 ${
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
                      €{conta.custo_produtos.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm">
                      €{conta.freight_rates.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm font-medium">
                      €{conta.total_caixa_pagar.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm text-green-600">
                      €{conta.valor_pago_fornecedor.toFixed(2)}
                    </div>
                    
                    <div className={`text-right text-sm font-bold ${
                      hasPendingBalance ? 'text-red-600' : 'text-green-600'
                    }`}>
                      €{conta.saldo_pagar_caixa.toFixed(2)}
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
                valor_total_custo: selectedConta.custo_produtos,
                valor_pago_fornecedor: selectedConta.valor_pago_fornecedor,
                saldo_devedor_fornecedor: selectedConta.saldo_pagar_caixa,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
