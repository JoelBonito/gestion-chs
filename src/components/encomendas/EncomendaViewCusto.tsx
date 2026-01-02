import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import { StatusEncomenda } from "@/types/entities";

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
    case "NOVO PEDIDO":
      return "bg-blue-600";
    case "MATÉRIA PRIMA":
      return "bg-orange-500";
    case "PRODUÇÃO":
      return "bg-sky-500";
    case "EMBALAGENS":
      return "bg-emerald-500";
    case "TRANSPORTE":
      return "bg-purple-600";
    case "ENTREGUE":
      return "bg-green-600";
    default:
      return "bg-slate-500";
  }
};

export function EncomendaViewCusto({ encomendaId }: EncomendaViewCustoProps) {
  const { user } = useAuth();
  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusLabel = (status: StatusEncomenda): string => {
    const isHamAdmin = user?.email === "ham@admin.com";
    if (!isHamAdmin) return status;

    switch (status) {
      case "NOVO PEDIDO":
        return "Nouvelle demande";
      case "MATÉRIA PRIMA":
        return "Matières premières";
      case "PRODUÇÃO":
        return "Production";
      case "EMBALAGENS":
        return "Emballage";
      case "TRANSPORTE":
        return "Transport";
      case "ENTREGUE":
        return "Livré";
      default:
        return status;
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
        .select(
          `
          *,
          clientes(nome),
          fornecedores(nome)
        `
        )
        .eq("id", encomendaId)
        .single();

      if (error) throw error;
      setEncomenda(data as any);
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
        .select(
          `
          *,
          produtos!inner(nome, marca, tipo, preco_custo)
        `
        )
        .eq("encomenda_id", encomendaId);

      if (error) throw error;
      setItens(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
      toast.error("Erro ao carregar itens da encomenda");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(/\s+€$/, "€");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT");
  };

  // Calcular totais com base nos preços de custo
  const totalCusto = itens.reduce((sum, item) => {
    const precoCusto = item.produtos?.preco_custo || 0;
    return sum + item.quantidade * precoCusto;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="border-primary h-8 w-8 animate-spin rounded-lg border-b-2"></div>
      </div>
    );
  }

  if (!encomenda) {
    return <div className="py-8 text-center">Encomenda não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Encomenda #{encomenda.numero_encomenda}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Criada em {formatDate(encomenda.data_criacao)}
              </p>
            </div>
            <Badge className={`${getStatusColor(encomenda.status)} text-primary-foreground`}>
              {getStatusLabel(encomenda.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">Cliente</h4>
              <p>{encomenda.clientes?.nome}</p>
            </div>
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">Fornecedor</h4>
              <p>{encomenda.fornecedores?.nome}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">Valor Total (Custo)</h4>
              <p className="text-lg font-semibold">{formatCurrency(totalCusto)}</p>
            </div>
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">
                Valor Pago ao Fornecedor
              </h4>
              <p className="text-success text-lg font-semibold">
                {formatCurrency(encomenda.valor_pago_fornecedor)}
              </p>
            </div>
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">
                Saldo Devedor ao Fornecedor
              </h4>
              <p className="text-destructive text-lg font-semibold">
                {formatCurrency(totalCusto - encomenda.valor_pago_fornecedor)}
              </p>
            </div>
          </div>

          {(encomenda.data_producao_estimada ||
            encomenda.data_envio_estimada ||
            encomenda.data_entrega) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {encomenda.data_producao_estimada && (
                    <div>
                      <h4 className="text-muted-foreground text-sm font-semibold">
                        Produção Estimada
                      </h4>
                      <p>{formatDate(encomenda.data_producao_estimada)}</p>
                    </div>
                  )}
                  {encomenda.data_envio_estimada && (
                    <div>
                      <h4 className="text-muted-foreground text-sm font-semibold">Envio Estimado</h4>
                      <p>{formatDate(encomenda.data_envio_estimada)}</p>
                    </div>
                  )}
                  {encomenda.data_entrega && (
                    <div>
                      <h4 className="text-muted-foreground text-sm font-semibold">Data de Entrega</h4>
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
                <h4 className="text-muted-foreground text-sm font-semibold">Observações</h4>
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
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <h4 className="font-medium">{item.produtos?.nome}</h4>
                    <p className="text-muted-foreground text-sm">
                      {item.produtos?.marca} • {item.produtos?.tipo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(subtotalCusto)}</p>
                    <p className="text-muted-foreground text-sm">
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
