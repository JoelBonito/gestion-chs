import { useEffect, useMemo, useState } from "react";
import { Eye, Edit, Printer, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import EncomendaView from "@/components/EncomendaView";
import { EncomendaForm } from "@/components/EncomendaForm";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";

interface Item {
  quantidade: number;
  preco_unitario: number;
  preco_custo: number;
  produtos?: { size_weight?: number | null } | null;
}

interface Encomenda {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;

  cliente_id: string;
  fornecedor_id: string;

  status: StatusEncomenda;

  data_producao_estimada?: string | null;
  data_envio_estimada?: string | null;

  valor_total: number;       // vendas
  valor_pago: number;

  // enriquecidos no front:
  commission_amount?: number;
  valor_total_custo?: number;
  itens_encomenda?: Item[];

  clientes?: { nome: string | null } | null;
  fornecedores?: { nome: string | null } | null;
}

const formatCurrency = (v: number | null | undefined) =>
  `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(v || 0)
  )}€`;

const formatDate = (d?: string | Date | null) => {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("pt-PT").format(new Date(d));
  } catch {
    return "—";
  }
};

export default function Encomendas() {
  const { canEdit, hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";
  const isHam = email === "ham@admin.com";

  const [loading, setLoading] = useState(true);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [selected, setSelected] = useState<Encomenda | null>(null);

  const canEditProductionUI = (canEdit() || hasRole("factory") || isCollaborator) && !isHam;
  const canEditDeliveryUI = (canEdit() || isCollaborator) && !isHam;

  // ====== FETCH OTIMIZADO (uma única query, sem N+1) ======
  const fetchEncomendas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          id,
          numero_encomenda,
          etiqueta,
          cliente_id,
          fornecedor_id,
          status,
          data_producao_estimada,
          data_envio_estimada,
          valor_total,
          valor_pago,
          clientes ( nome ),
          fornecedores ( nome ),
          itens_encomenda (
            quantidade,
            preco_unitario,
            preco_custo,
            produtos ( size_weight )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched: Encomenda[] =
        (data || []).map((enc: any) => {
          let commission = 0;
          let custo = 0;
          (enc.itens_encomenda || []).forEach((it: Item) => {
            const q = Number(it.quantidade || 0);
            const pv = Number(it.preco_unitario || 0);
            const pc = Number(it.preco_custo || 0);
            commission += q * pv - q * pc;
            custo += q * pc;
          });
          return {
            ...enc,
            commission_amount: commission,
            valor_total_custo: custo,
          } as Encomenda;
        }) ?? [];

      setEncomendas(enriched);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  // ====== HANDLERS ======
  const handleStatusChanged = async () => {
    await fetchEncomendas();
  };

  const handleDateUpdate = async (
    encomendaId: string,
    field: "data_producao_estimada" | "data_envio_estimada",
    value: string
  ) => {
    if ((field === "data_producao_estimada" && !canEditProductionUI) || (field === "data_envio_estimada" && !canEditDeliveryUI)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ [field]: value || null })
        .eq("id", encomendaId);
      if (error) throw error;
      setEncomendas((prev) => prev.map((e) => (e.id === encomendaId ? { ...e, [field]: value || null } : e)));
      toast.success("Data atualizada");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar");
    }
  };

  // ====== RENDER ======
  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      {encomendas.map((e) => {
        // peso bruto estimado (mantém cálculo existente; usa itens_encomenda -> produtos.size_weight)
        const pesoBrutoKg = useMemo(() => {
          const totalSW =
            (e.itens_encomenda || []).reduce((acc, it) => {
              const q = Number(it.quantidade || 0);
              const sw = Number(it.produtos?.size_weight || 0);
              return acc + q * sw;
            }, 0) || 0;
          return (totalSW * 1.3) / 1000; // mesmo ajuste do projeto
        }, [e.itens_encomenda]);

        return (
          <Card key={e.id}>
            <CardContent className="p-6 space-y-6">
              {/* ===== Linha 1 (layout original) ===== */}
              <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Pedido</div>
                  <div className="font-bold text-primary">#{e.numero_encomenda}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Etiqueta</div>
                  <div className="px-3 py-1 rounded-full bg-gray-100 inline-block">{e.etiqueta || "—"}</div>
                </div>

                <div className="col-span-3">
                  <div className="text-sm text-muted-foreground">Cliente</div>
                  <div className="font-medium">{e.clientes?.nome ?? "—"}</div>
                </div>

                <div className="col-span-3">
                  <div className="text-sm text-muted-foreground">Fornecedor</div>
                  <div className="font-medium">{e.fornecedores?.nome ?? "—"}</div>
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setSelected(e); setViewOpen(true); }}>
                    <Eye />
                  </Button>
                  {canEdit() && (
                    <Button variant="ghost" size="icon" onClick={() => { setSelected(e); setEditOpen(true); }}>
                      <Edit />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => window.print()}>
                    <Printer />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setSelected(e); setTransportOpen(true); }}>
                    <Truck />
                  </Button>
                  <EncomendaActions encomenda={e} onChange={fetchEncomendas} />
                </div>
              </div>

              {/* ===== Linha 2 (layout original; campos no mesmo lugar) ===== */}
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Data Produção</div>
                  <div className="text-base">{formatDate(e.data_producao_estimada)}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Data Entrega</div>
                  <div className="text-base">{formatDate(e.data_envio_estimada)}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Peso Bruto</div>
                  <div className="text-base font-semibold text-blue-600">
                    {new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                      pesoBrutoKg
                    )}{" "}
                    kg
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Valor Frete</div>
                  {/* mantém o lugar; se não houver frete salvo aqui, exibe 0,00€ */}
                  <div className="text-base font-semibold text-amber-700 bg-amber-50 rounded px-3 py-1 inline-block">
                    {formatCurrency(0)}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <EncomendaStatusSelect encomendaId={e.id} onStatusChanged={handleStatusChanged} />
                </div>

                <div className="col-span-1">
                  <div className="text-sm text-muted-foreground">Comissão</div>
                  <div className="text-base font-semibold text-emerald-600 bg-emerald-50 rounded px-3 py-1 inline-block">
                    {formatCurrency(e.commission_amount || 0)}
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                  <div className="text-base font-semibold text-violet-600 bg-violet-50 rounded px-3 py-1 inline-block">
                    {formatCurrency(isFelipe ? e.valor_total_custo || 0 : e.valor_total || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {/* Dialogs (mantidos) */}
      {selected && (
        <>
          <EncomendaView open={viewOpen} onOpenChange={setViewOpen} encomenda={selected} />
          <EncomendaForm open={editOpen} onOpenChange={setEditOpen} encomenda={selected} onSaved={fetchEncomendas} />
          <EncomendaTransportForm
            open={transportOpen}
            onOpenChange={setTransportOpen}
            encomendaId={selected.id}
            onSaved={fetchEncomendas}
          />
        </>
      )}
    </div>
  );
}
