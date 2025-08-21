
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: string;
  status_producao?: string;
  valor_total: number;
  valor_pago: number;
  saldo_devedor?: number;
  data_criacao: string;
  data_entrega?: string;
  data_producao_estimada?: string;
  data_envio_estimada?: string;
  observacoes?: string;
  cliente_id: string;
  fornecedor_id: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

interface ItemEncomenda {
  id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_id: string;
  produtos?: { nome: string; marca: string; tipo: string };
}

interface EncomendaViewProps {
  encomendaId: string;
}

export function EncomendaView({ encomendaId }: EncomendaViewProps) {
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEncomenda();
    fetchItens();
  }, [encomendaId]);

  const fetchEncomenda = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(nome),
          fornecedores(nome)
        `)
        .eq("id", encomendaId)
        .single();

      if (error) throw error;
      setEncomenda(data);
    } catch (error) {
      console.error("Erro ao carregar encomenda:", error);
      toast.error("Erro ao carregar encomenda");
    } finally {
      setLoading(false);
    }
  };

  const fetchItens = async () => {
    try {
      const { data, error } = await supabase
        .from("itens_encomenda")
        .select(`
          *,
          produtos(nome, marca, tipo)
        `)
        .eq("encomenda_id", encomendaId);

      if (error) throw error;
      setItens(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
      toast.error("Erro ao carregar itens da encomenda");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!encomenda) {
    return <div className="text-center py-8">Encomenda não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Encomenda #{encomenda.numero_encomenda}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Criada em {formatDate(encomenda.data_criacao)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Cliente</h4>
              <p>{encomenda.clientes?.nome}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Fornecedor</h4>
              <p>{encomenda.fornecedores?.nome}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Valor Total</h4>
              <p className="text-lg font-semibold">{formatCurrency(encomenda.valor_total)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Valor Pago</h4>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(encomenda.valor_pago)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Saldo Devedor</h4>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(encomenda.valor_total - encomenda.valor_pago)}
              </p>
            </div>
          </div>

          {(encomenda.data_producao_estimada || encomenda.data_envio_estimada || encomenda.data_entrega) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {encomenda.data_producao_estimada && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Produção Estimada</h4>
                    <p>{formatDate(encomenda.data_producao_estimada)}</p>
                  </div>
                )}
                {encomenda.data_envio_estimada && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Envio Estimado</h4>
                    <p>{formatDate(encomenda.data_envio_estimada)}</p>
                  </div>
                )}
                {encomenda.data_entrega && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Data de Entrega</h4>
                    <p>{formatDate(encomenda.data_entrega)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {encomenda.observacoes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Observações</h4>
                <p className="mt-1">{encomenda.observacoes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Encomenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {itens.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{item.produtos?.nome}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.produtos?.marca} • {item.produtos?.tipo}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantidade}x {formatCurrency(item.preco_unitario)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
