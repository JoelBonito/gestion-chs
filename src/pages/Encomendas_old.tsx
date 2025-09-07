import { useEffect, useState } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit, Printer, Truck, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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
  // calculados no front:
  commission_amount?: number;
  valor_total_custo?: number;
}

interface ItemRow {
  quantidade: number;
  preco_unitario: number;
  preco_custo: number;
  produtos?: { nome?: string | null; size_weight?: number | null } | null;
}

const formatCurrency = (value: number) => {
  // Queremos "8.500,00€" (ponto no milhar, vírgula decimal, símbolo colado)
  // pt-BR para número (usa . no milhar, , decimal), depois acrescenta "€" sem espaço.
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

  // Dicionário (FR para Ham, PT para demais)
  const t = isHam
    ? {
        orders: "Commandes",
        manageOrders: "Gérer vos commandes",
        newOrder: "Nouvelle commande",
        searchPlaceholder: "Rechercher par numéro, client, fournisseur ou étiquette...",
        showDelivered: "Afficher livrées",
        noOrders: "Aucune commande trouvée",
        order: "Commande",
        label: "Étiquette",
        client: "Client",
        supplier: "Fournisseur",
        status: "Statut",
        productionDate: "Date de production",
        deliveryDate: "Date de livraison",
        grossWeight: "Poids brut",
        shippingValue: "Valeur du transport",
        commission: "Commission",
        total: "Valeur Totale",
        totalCost: "Coût total",
        paid: "Montant payé",
        notes: "Observations",
        viewOrder: "Voir la commande",
        editOrder: "Modifier la commande",
        transportConfig: "Configurer le transport",
        select: "Sélectionner",
        loadingOrders: "Chargement des commandes...",
        createdOn: "Créée le",
        errLoad: "Erreur lors du chargement des commandes",
        printOpened: "Fenêtre d’impression ouverte",
        printError: "Erreur lors de l’ouverture de l’impression",
      }
    : {
        orders: "Encomendas",
        manageOrders: "Gerencie suas encomendas",
        newOrder: "Nova Encomenda",
        searchPlaceholder: "Buscar por número, cliente, fornecedor ou etiqueta...",
        showDelivered: "Mostrar entregues",
        noOrders: "Nenhuma encomenda encontrada",
        order: "Pedido",
        label: "Etiqueta",
        client: "Cliente",
        supplier: "Fornecedor",
        status: "Status",
        productionDate: "Data Produção",
        deliveryDate: "Data Entrega",
        grossWeight: "Peso Bruto",
        shippingValue: "Valor Frete",
        commission: "Comissão",
        total: "Valor Total",
        totalCost: "Custo Total",
        paid: "Valor Pago",
        notes: "Observações",
        viewOrder: "Visualizar Encomenda",
        editOrder: "Editar Encomenda",
        transportConfig: "Configurar Transporte",
        select: "Selecionar",
        loadingOrders: "Carregando encomendas...",
        createdOn: "Criada em",
        errLoad: "Erro ao carregar encomendas",
        printOpened: "Janela de impressão aberta",
        printError: "Erro ao abrir impressão",
      };

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

  // Busca encomendas + calcula comissão e custo total
  const fetchEncomendas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(`*, clientes(nome), fornecedores(nome)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const computed = await Promise.all(
        (data || []).map(async (enc: any) => {
          const { data: itens } = await supabase
            .from("itens_encomenda")
            .select(`quantidade, preco_unitario, preco_custo, produtos(size_weight)`)
            .eq("encomenda_id", enc.id);

          let commission_amount = 0;
          let valor_total_custo = 0;
          let peso = 0;

          (itens || []).forEach((it: ItemRow) => {
            const q = Number(it.quantidade || 0);
            const pv = Number(it.preco_unitario || 0);
            const pc = Number(it.preco_custo || 0);
            const sw = Number(it.produtos?.size_weight || 0);
            commission_amount += q * pv - q * pc;
            valor_total_custo += q * pc;
            peso += q * sw;
          });

          // peso em kg com fator 1.3
          const kg = (peso * 1.3) / 1000;

          return { ...enc, commission_amount, valor_total_custo, _pesoKg: kg } as Encomenda & { _pesoKg: number };
        })
      );

      setEncomendas(computed);
      const pesos: Record<string, number> = {};
      for (const c of computed) pesos[(c as any).id] = (c as any)._pesoKg || 0;
      setPesoTransporte(pesos);
    } catch (e) {
      console.error(e);
      toast.error(t.errLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.success(isHam ? "Mise à jour effectuée" : "Data atualizada");
    } catch (e) {
      console.error(e);
      toast.error(isHam ? "Erreur lors de la mise à jour" : "Erro ao atualizar");
    }
  };

  const handlePrint = async (enc: Encomenda) => {
    try {
      const win = window.open("", "_blank", "width=800,height=600");
      if (!win) return toast.error(t.printError);

      const html = `
        <!doctype html><html><head>
          <meta charset="utf-8" />
          <title>${t.order} #${enc.numero_encomenda}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, sans-serif; color:#000; }
            .title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
            .sub { color:#555; margin-bottom: 10px; }
            .row { margin: 6px 0; }
            .label { width: 140px; display:inline-block; font-weight:600; }
          </style>
        </head><body>
          <div class="title">${t.order} #${enc.numero_encomenda}</div>
          <div class="sub">${t.createdOn} ${formatDate(enc.data_criacao)}</div>
          ${enc.etiqueta ? `<div class="row"><span class="label">${t.label}:</span>${enc.etiqueta}</div>` : ""}
          <div class="row"><span class="label">${t.client}:</span>${enc.clientes?.nome ?? "N/A"}</div>
          <div class="row"><span class="label">${t.supplier}:</span>${enc.fornecedores?.nome ?? "N/A"}</div>
          <div class="row"><span class="label">${t.status}:</span>${enc.status}</div>
          <div class="row"><span class="label">${isFelipe ? t.totalCost : t.total}:</span>${
            formatCurrency(isFelipe ? enc.valor_total_custo ?? 0 : enc.valor_total)
          }</div>
          ${!isFelipe ? `<div class="row"><span class="label">${t.paid}:</span>${formatCurrency(enc.valor_pago)}</div>` : ""}
          ${enc.observacoes ? `<div class="row"><span class="label">${t.notes}:</span>${enc.observacoes}</div>` : ""}
        </body></html>
      `;
      win.document.write(html);
      win.document.close();
      (win as any).onload = () => {
        (win as any).print();
        (win as any).onafterprint = () => (win as any).close();
      };
      toast.success(t.printOpened);
    } catch {
      toast.error(t.printError);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loadingOrders}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.orders}</h1>
          <p className="text-muted-foreground">{t.manageOrders}</p>
        </div>

        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t.newOrder}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.newOrder}</DialogTitle>
                <DialogDescription>
                  {isHam
                    ? "Créez une nouvelle commande en remplissant les champs ci-dessous."
                    : "Crie uma nova encomenda preenchendo os dados abaixo."}
                </DialogDescription>
              </DialogHeader>
              <EncomendaForm
                onSuccess={() => {
                  setDialogOpen(false);
                  fetchEncomendas();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <EncomendaStatusFilter selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
                <Label htmlFor="show-completed">{t.showDelivered}</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{t.noOrders}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} className="shadow-card transition-all duration-300 hover:shadow-hover">
              <CardContent className="p-6">
                {/* Linha principal */}
                <div className="grid grid-cols-12 gap-6 items-start mb-6">
                  {/* Pedido */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.order}</div>
                    <div className="font-bold text-lg text-primary-dark truncate">#{e.numero_encomenda}</div>
                  </div>

                  {/* Etiqueta */}
                  {e.etiqueta && (
                    <div className="col-span-6 sm:col-span-6 lg:col-span-2 min-w-0">
                      <div className="text-sm font-medium text-muted-foreground mb-1">{t.label}</div>
                      <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit truncate">
                        {e.etiqueta}
                      </div>
                    </div>
                  )}

                  {/* Cliente */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-3 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.client}</div>
                    <div className="text-base font-semibold truncate">{e.clientes?.nome ?? "—"}</div>
                  </div>

                  {/* Fornecedor */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-3 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.supplier}</div>
                    <div className="text-base truncate">{e.fornecedores?.nome ?? "—"}</div>
                  </div>

                  {/* Ações */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2 flex items-center gap-2 justify-end">
                    <Button variant="ghost" size="icon" title={t.viewOrder} onClick={() => { setSelectedEncomenda(e); setViewDialogOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit() && (
                      <Button variant="ghost" size="icon" title={t.editOrder} onClick={() => { setSelectedEncomenda(e); setEditDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Imprimir" onClick={() => handlePrint(e)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t.transportConfig} onClick={() => { setSelectedEncomenda(e); setTransportDialogOpen(true); }}>
                      <Truck className="h-4 w-4" />
                    </Button>
                    <EncomendaActions encomenda={e} onChange={fetchEncomendas} />
                  </div>
                </div>

                {/* Linha 2: Datas / Peso / Frete / Status / Comissão / Totais */}
                <div className="grid grid-cols-12 gap-6">
                  {/* Data Produção */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.productionDate}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatDate(e.data_producao_estimada)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={e.data_producao_estimada ? new Date(e.data_producao_estimada) : undefined}
                          onSelect={(d) => handleDateUpdate(e.id, "data_producao_estimada", d ? d.toISOString() : "")}
                          disabled={!canEditProductionUI}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Data Entrega */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.deliveryDate}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formatDate(e.data_envio_estimada)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={e.data_envio_estimada ? new Date(e.data_envio_estimada) : undefined}
                          onSelect={(d) => handleDateUpdate(e.id, "data_envio_estimada", d ? d.toISOString() : "")}
                          disabled={!canEditDeliveryUI}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Peso bruto */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{
                      isHam ? "Poids brut" : "Peso Bruto"
                    }</div>
                    <div className="text-lg font-bold text-blue-600">{(pesoTransporte[e.id] ?? 0).toFixed(2)} kg</div>
                  </div>

                  {/* Valor Frete (usa valor_total_custo*0 aqui só para exibir de exemplo; se houver campo, troque) */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.shippingValue}</div>
                    <div className="text-lg font-semibold bg-amber-50 rounded px-3 py-1 w-fit">
                      {formatCurrency(0)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.status}</div>
                    <EncomendaStatusSelect encomenda={e} onStatusChanged={handleStatusChange} />
                  </div>

                  {/* Comissão */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.commission}</div>
                    <div className="text-lg font-semibold bg-emerald-50 rounded px-3 py-1 w-fit">
                      {formatCurrency(e.commission_amount ?? 0)}
                    </div>
                  </div>

                  {/* Valor Total / ou Custo Total p/ Felipe */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {isFelipe ? t.totalCost : t.total}
                    </div>
                    <div className="text-lg font-bold text-purple-700 bg-purple-50 rounded px-3 py-1 w-fit">
                      {formatCurrency(isFelipe ? e.valor_total_custo ?? 0 : e.valor_total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {selectedEncomenda && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.viewOrder}</DialogTitle>
            </DialogHeader>
            <EncomendaView encomendaId={selectedEncomenda.id} />
          </DialogContent>
        </Dialog>
      )}

      {selectedEncomenda && (
        <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t.transportConfig}</DialogTitle>
            </DialogHeader>
            <EncomendaTransportForm
              encomenda={selectedEncomenda}
              onSuccess={() => {
                setTransportDialogOpen(false);
                fetchEncomendas();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedEncomenda && canEdit() && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.editOrder}</DialogTitle>
            </DialogHeader>
            <EncomendaForm
              encomenda={selectedEncomenda}
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchEncomendas();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
