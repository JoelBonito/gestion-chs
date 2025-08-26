import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PagamentoForm from "./PagamentoForm";
import type { EncomendaFinanceiro } from "@/types/financeiro";

export default function EncomendasFinanceiro() {
  const [encomendas, setEncomendas] = useState<EncomendaFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const [selectedEncomenda, setSelectedEncomenda] = useState<EncomendaFinanceiro | null>(null);
  const { toast } = useToast();

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          valor_total,
          valor_pago,
          valor_frete,
          clientes(id, nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas: EncomendaFinanceiro[] = (data ?? []).map((e: any) => {
        const valorProdutos = Number(e.valor_total || 0);
        const valorFrete = Number(e.valor_frete || 0);
        const valorPago = Number(e.valor_pago || 0);
        
        // CORRIGIDO: A RECEBER = Valor dos produtos + Valor do frete
        const totalCaixa = valorProdutos + valorFrete;
        const saldoDevedorCaixa = Math.max(0, totalCaixa - valorPago);

        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          cliente_nome: e.clientes?.nome || "",
          valor_total: valorProdutos,
          valor_pago: valorPago,
          saldo_devedor: Math.max(0, valorProdutos - valorPago),
          valor_frete: valorFrete,
          total_caixa: totalCaixa,
          saldo_devedor_caixa: saldoDevedorCaixa,
        };
      });

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

  const handlePagamentoSuccess = () => {
    setShowPagamentoDialog(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
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
          <CardTitle>Contas a Receber</CardTitle>
          <CardDescription>
            A receber = Valor dos produtos + Valor do frete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {encomendas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma encomenda encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                <div>Encomenda</div>
                <div>Cliente</div>
                <div className="text-right">Produtos</div>
                <div className="text-right">Frete</div>
                <div className="text-right">Total a Receber</div>
                <div className="text-right">Pago</div>
                <div className="text-right">Saldo</div>
                <div className="text-center">Ações</div>
              </div>

              {/* Rows */}
              {encomendas.map((encomenda) => {
                const hasPendingBalance = encomenda.saldo_devedor_caixa > 0;
                return (
                  <div 
                    key={encomenda.id} 
                    className={`grid grid-cols-8 gap-4 items-center py-3 border-b hover:bg-gray-50 ${
                      hasPendingBalance ? 'bg-orange-50' : 'bg-green-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{encomenda.numero_encomenda}</p>
                      {hasPendingBalance && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm">{encomenda.cliente_nome}</div>
                    
                    <div className="text-right text-sm">
                      €{encomenda.valor_total.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm">
                      €{encomenda.valor_frete.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm font-medium">
                      €{encomenda.total_caixa.toFixed(2)}
                    </div>
                    
                    <div className="text-right text-sm text-green-600">
                      €{encomenda.valor_pago.toFixed(2)}
                    </div>
                    
                    <div className={`text-right text-sm font-bold ${
                      hasPendingBalance ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      €{encomenda.saldo_devedor_caixa.toFixed(2)}
                    </div>
                    
                    <div className="text-center">
                      {hasPendingBalance ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEncomenda(encomenda);
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
          {selectedEncomenda && (
            <PagamentoForm 
              onSuccess={handlePagamentoSuccess}
              encomendas={[selectedEncomenda]}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
