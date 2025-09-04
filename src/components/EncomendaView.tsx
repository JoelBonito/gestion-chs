
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { OrderItemsView } from "@/components/OrderItemsView";
import { EncomendaObservations } from "@/components/EncomendaObservations";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: StatusEncomenda;
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


interface EncomendaViewProps {
  encomendaId: string;
}

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

export function EncomendaView({ encomendaId }: EncomendaViewProps) {
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [loading, setLoading] = useState(true);
  const isCollaborator = useIsCollaborator();

  useEffect(() => {
    fetchEncomenda();
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
            <Badge className={`${getStatusColor(encomenda.status)} text-white`}>
              {encomenda.status}
            </Badge>
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

          <Separator />
          <EncomendaObservations
            encomendaId={encomendaId}
            observacoes={encomenda.observacoes}
            onUpdate={fetchEncomenda}
            canEdit={isCollaborator}
          />
        </CardContent>
      </Card>

      {/* Items */}
      <OrderItemsView encomendaId={encomendaId} showCostPrices={isCollaborator} />
    </div>
  );
}
