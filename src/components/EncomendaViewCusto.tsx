
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type StatusEncomenda = "NOVO PEDIDO" | "MATÉRIA PRIMA" | "PRODUÇÃO" | "EMBALAGENS" | "TRANSPORTE" | "ENTREGUE";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  status: StatusEncomenda;
  status_producao?: string;
  valor_total_custo: number;
  valor_pago_fornecedor: number;
  saldo_devedor_fornecedor?: number;
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
  produtos?: { 
    nome: string; 
    marca: string; 
    tipo: string;
    preco_custo: number;
  };
}

interface EncomendaViewCustoProps {
  encomendaId: string;
}

const getStatusColor = (status: StatusEncomenda) => {
  switch (status) {
    case "NOVO PEDIDO": return "bg-gray-500";
    case "MATÉRIA PRIMA": return "bg-orange-500";
    case "PRODUÇÃO": return "bg-blue-500";
    case "EMBALAGENS": return "bg-yellow-500";
    case "TRANSPORTE": return "bg-purple-500";
    case "ENTREGUE": return "bg-green-500";
    default: return "bg-gray-500";
  }
};

export function EncomendaViewCusto({ encomendaId }: EncomendaViewCustoProps) {
  const { user } = useAuth();
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusLabel = (status: StatusEncomenda): string => {
    const isHamAdmin = user?.email === 'ham@admin.com';
    if (!isHamAdmin) return status;
    
    switch (status) {
      case "NOVO PEDIDO": return "Nouvelle demande";
      case "MATÉRIA PRIMA": return "Matières premières";
      case "PRODUÇÃO": return "Production";
      case "EMBALAGENS": return "Emballage";
      case "TRANSPORTE": return "Transport";
      case "ENTREGUE": return "Livré";
      default: return status;
    }
  };

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
          produtos!inner(nome, marca, tipo, preco_custo)
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
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value).replace(/\s+€$/, '€');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  // Calcular totais com base nos preços de custo
  const totalCusto = itens.reduce((sum, item) => {
    const precoCusto = item.produtos?.preco_custo || 0;
    return sum + (item.quantidade * precoCusto);
  }, 0);

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
              {getStatusLabel(encomenda.status)}
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
              <h4 className="font-semibold text-sm text-muted-foreground">Valor Total (Custo)</h4>
              <p className="text-lg font-semibold">{formatCurrency(totalCusto)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Valor Pago ao Fornecedor</h4>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(encomenda.valor_pago_fornecedor)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Saldo Devedor ao Fornecedor</h4>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(totalCusto - encomenda.valor_pago_fornecedor)}
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

      {/* Items with Cost Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Encomenda (Preços de Custo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {itens.map((item) => {
              const precoCusto = item.produtos?.preco_custo || 0;
              const subtotalCusto = item.quantidade * precoCusto;
              
              return (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.produtos?.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.produtos?.marca} • {item.produtos?.tipo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(subtotalCusto)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantidade}x {formatCurrency(precoCusto)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
