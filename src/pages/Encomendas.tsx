import { useEffect, useState } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit, Printer, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { EncomendaForm } from "@/components/EncomendaForm";
import EncomendaView from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";
type StatusFilter = StatusEncomenda | "TODOS";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  status: StatusEncomenda;
  valor_total: number;
  valor_pago: number;
  data_criacao: string;
  data_producao_estimada?: string | null;
  data_envio_estimada?: string | null;
  observacoes?: string | null;
  clientes?: { nome: string | null } | null;
  fornecedores?: { nome: string | null } | null;
  commission_amount?: number;
  valor_total_custo?: number;
  itens_encomenda?: {
    quantidade: number;
    preco_unitario: number;
    preco_custo: number;
    produtos?: { size_weight?: number | null } | null;
  }[];
}

const formatCurrency = (value: number) => {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}€`;
};

const formatDate = (dateLike?: string | Date | null) => {
  if (!dateLike) return "—";
  try {
    const d = new Date(dateLike);
    return new Intl.DateTimeFormat("pt-PT").format(d);
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

  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("TODOS");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesoTransporte, setPesoTransporte] = useState<Record<string, number>>({});

  const canEditProductionUI = (canEdit() || hasRole("factory") || isCollaborator) && !isHam;
  const canEditDeliveryUI = (canEdit() || isCollaborator) && !isHam;

  // 🔥 Query otimizada sem N+1
  const fetchEncomendas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes (id, nome),
          fornecedores (id, nome),
          itens_encomenda (
            quantidade,
            preco_unitario,
            preco_custo,
            produtos (size_weight)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const computed = (data || []).map((enc: any) => {
        let commission_amount = 0;
        let valor_total_custo = 0;
        let peso = 0;

        (enc.itens_encomenda || []).forEach((it: any) => {
          const q = Number(it.quantidade || 0);
          const pv = Number(it.preco_unitario || 0);
          const pc = Number(it.preco_custo || 0);
          const sw = Number(it.produtos?.size_weight || 0);

          commission_amount += q * pv - q * pc;
          valor_total_custo += q * pc;
          peso += q * sw;
        });

        return {
          ...enc,
          commission_amount,
          valor_total_custo,
          _pesoKg: (peso * 1.3) / 1000,
        } as Encomenda & { _pesoKg: number };
      });

      setEncomendas(computed);

      const pesos: Record<string, number> = {};
      for (const enc of computed) pesos[enc.id] = (enc as any)._pesoKg || 0;
      setPesoTransporte(pesos);
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

  const handleStatusChange = async () => {
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
      const { error } = await supabase.from("encomendas").update({ [field]: value || null }).eq("id", encomendaId);
      if (error) throw error;
      setEncomendas((prev) =>
        prev.map((enc) => (enc.id === encomendaId ? { ...enc, [field]: value || null } : enc))
      );
      toast.success("Data atualizada");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar");
    }
  };

  const handlePrint = async (enc: Encomenda) => {
    try {
      const win = window.open("", "_blank", "width=800,height=600");
      if (!win) return toast.error("Erro ao imprimir");
      const html = `
        <!doctype html><html><head><meta charset="utf-8" /><title>Pedido #${enc.numero_encomenda}</title></head><body>
        <h1>Pedido #${enc.numero_encomenda}</h1>
        </body></html>`;
      win.document.write(html);
      win.document.close();
      (win as any).onload = () => {
        (win as any).print();
        (win as any).onafterprint = () => (win as any).close();
      };
      toast.success("Impressão aberta");
    } catch {
      toast.error("Erro ao imprimir");
    }
  };

  const filtered = encomendas.filter((e) => {
    const q = searchTerm.trim().toLowerCase();
    const byText =
      e.numero_encomenda.toLowerCase().includes(q) ||
      (e.etiqueta || "").toLowerCase().includes(q) ||
      (e.clientes?.nome || "").toLowerCase().includes(q) ||
      (e.fornecedores?.nome || "").toLowerCase().includes(q);
    const byDelivered = showCompleted ? e.status === "ENTREGUE" : e.status !== "ENTREGUE";
    const byStatus = selectedStatus === "TODOS" || e.status === selectedStatus;
    return byText && byDelivered && byStatus;
  });

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      {filtered.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-6 space-y-6">
            {/* Linha 1 */}
            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-2 font-bold">#{e.numero_encomenda}</div>
              {e.etiqueta && <div className="col-span-2">{e.etiqueta}</div>}
              <div className="col-span-3">{e.clientes?.nome ?? "—"}</div>
              <div className="col-span-3">{e.fornecedores?.nome ?? "—"}</div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button onClick={() => { setSelectedEncomenda(e); setViewDialogOpen(true); }}><Eye /></Button>
                {canEdit() && <Button onClick={() => { setSelectedEncomenda(e); setEditDialogOpen(true); }}><Edit /></Button>}
                <Button onClick={() => handlePrint(e)}><Printer /></Button>
                <Button onClick={() => { setSelectedEncomenda(e); setTransportDialogOpen(true); }}><Truck /></Button>
                <EncomendaActions encomenda={e} onChange={fetchEncomendas} />
              </div>
            </div>

            {/* Linha 2 */}
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-2">{formatDate(e.data_producao_estimada)}</div>
              <div className="col-span-2">{formatDate(e.data_envio_estimada)}</div>
              <div className="col-span-2">{(pesoTransporte[e.id] ?? 0).toFixed(2)} kg</div>
              <div className="col-span-2">{formatCurrency(0)}</div>
              <div className="col-span-2">
                <EncomendaStatusSelect encomenda={e} onStatusChanged={handleStatusChange} />
              </div>
              <div className="col-span-1">{formatCurrency(e.commission_amount ?? 0)}</div>
              <div className="col-span-1">{formatCurrency(isFelipe ? e.valor_total_custo ?? 0 : e.valor_total)}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
