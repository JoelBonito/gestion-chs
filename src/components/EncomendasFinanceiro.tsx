
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
          saldo_devedor,
          frete_encomenda(valor_frete),
          clientes(id, nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas: EncomendaFinanceiro[] = (data ?? []).map((e: any) => {
        const produtos = Number(e.valor_total ?? 0);
        const frete = Number(e.frete_encomenda?.[0]?.valor_frete ?? 0);
        const pago = Number(e.valor_pago ?? 0);

        return {
          id: e.id,
          numero_encomenda: e.numero_encomenda,
          cliente_nome: e.clientes?.nome ?? "",
          valor_total: produtos,
          valor_pago: pago,
          saldo_devedor: Math.max(produtos - pago, 0),
          valor_frete: frete,
          total_caixa: produtos + frete,
          saldo_devedor_caixa: Math.max(produtos + frete - pago, 0),
        };
      }).filter(e => e.saldo_devedor_caixa > 0); // Filtrar em memória após o mapeamento

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
            Encomendas com saldo devedor (Total Caixa = Produtos + Frete)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {encomendas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma encomenda com saldo devedor encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-500 pb-2 border-b">
                <div>Encomenda</div>
                <div>Cliente</div>
                <div className="text-right">Produtos</div>
                <div className="text-right">Frete</div>
                <div className="text-right">Total Caixa</div>
                <div className="text-right">Pago</div>
                <div className="text-right">Saldo</div>
                <div className="text-center">Ações</div>
              </div>

              {/* Rows */}
              {encomendas.map((encomenda) => (
                <div key={encomenda.id} className="grid grid-cols-8 gap-4 items-center py-3 border-b hover:bg-gray-50">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{encomenda.numero_encomenda}</p>
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
                  
                  <div className="text-right text-sm font-bold text-orange-600">
                    €{encomenda.saldo_devedor_caixa.toFixed(2)}
                  </div>
                  
                  <div className="text-center">
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
                  </div>
                </div>
              ))}
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
