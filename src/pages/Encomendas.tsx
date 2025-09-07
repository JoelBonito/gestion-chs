// src/pages/Encomendas.tsx
import { useState, useEffect } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useFormatters } from "@/hooks/useFormatters";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { EncomendaForm } from "@/components/EncomendaForm";
import  EncomendaView  from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Tipos */
type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";
type StatusFilter = StatusEncomenda | "TODOS";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  etiqueta?: string;
  status: StatusEncomenda;
  status_producao?: string;
  valor_total: number;
  valor_pago: number;
  data_criacao: string;
  data_entrega?: string;
  data_producao_estimada?: string;
  data_envio_estimada?: string;
  observacoes?: string;
  cliente_id: string;
  fornecedor_id: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
  commission_amount?: number;
  valor_total_custo?: number;
}

export default function Encomendas() {
  const { canEdit, hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { formatCurrency, formatDate } = useFormatters();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("TODOS");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);

  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesoTransporte, setPesoTransporte] = useState<{ [key: string]: number }>({});
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Descobre o usuário logado (regras para Felipe/Ham + idioma)
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
        printOpened: "Janela de impressão aberta",
        printError: "Erro ao abrir impressão",
      };

  /** Buscar encomendas + cálculos auxiliares */
  const fetchEncomendas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(nome),
          fornecedores(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const encomendasWithComputed = await Promise.all(
          (data as any[]).map(async (encomenda) => {
            const { data: itens, error: itensError } = await supabase
              .from("itens_encomenda")
              .select(`quantidade, preco_unitario, preco_custo`)
              .eq("encomenda_id", encomenda.id);

            let commission_amount = 0;
            let valor_total_custo = 0;

            if (!itensError && itens) {
              commission_amount = itens.reduce((total: number, item: any) => {
                const receita = Number(item.quantidade || 0) * Number(item.preco_unitario || 0);
                const custo = Number(item.quantidade || 0) * Number(item.preco_custo || 0);
                return total + (receita - custo);
              }, 0);

              valor_total_custo = itens.reduce((total: number, item: any) => {
                return total + Number(item.quantidade || 0) * Number(item.preco_custo || 0);
              }, 0);
            }

            return {
              ...encomenda,
              commission_amount,
              valor_total_custo,
            } as Encomenda;
          })
        );

        setEncomendas(encomendasWithComputed || []);

        const pesos: { [key: string]: number } = {};
        for (const enc of encomendasWithComputed) {
          const pesoCalculado = await calcularPesoTransporte(enc.id);
          pesos[enc.id] = pesoCalculado;
        }
        setPesoTransporte(pesos);
      }
    } catch (e) {
      console.error("Erro ao carregar encomendas:", e);
      toast.error(isHam ? "Erreur lors du chargement des commandes" : "Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  /** Peso de transporte (size_weight em gramas + 30% margem) */
  const calcularPesoTransporte = async (encomendaId: string): Promise<number> => {
    try {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`quantidade, produtos(size_weight)`)
        .eq("encomenda_id", encomendaId);

      if (error || !itens) return 0;

      const pesoTotalGramas = itens.reduce((total: number, item: any) => {
        const quantidade = Number(item.quantidade || 0);
        const sizeWeight = Number(item.produtos?.size_weight || 0);
        return total + quantidade * sizeWeight;
      }, 0);

      return (pesoTotalGramas * 1.3) / 1000; // kg
    } catch (e) {
      console.error("Erro ao calcular peso:", e);
      return 0;
    }
  };

  useEffect(() => {
    fetchEncomendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Impressão rápida */
  const handlePrint = async (encomenda: Encomenda) => {
    try {
      const win = window.open("", "_blank", "width=800,height=600");
      if (!win) {
        toast.error(isHam ? "Impossible d’ouvrir la fenêtre d’impression" : t.printError);
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${t.order} #${encomenda.numero_encomenda}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 12px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; }
            .content { margin: 20px 0; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; display: inline-block; width: 160px; }
            .value { display: inline-block; }
            .row { margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${t.order} #${encomenda.numero_encomenda}</div>
            ${encomenda.etiqueta ? `<div class="subtitle">${t.label}: ${encomenda.etiqueta}</div>` : ""}
            <div class="subtitle">${t.createdOn} ${formatDate(encomenda.data_criacao)}</div>
          </div>

          <div class="content">
            <div class="section">
              <div class="row"><span class="label">${t.client}:</span> <span class="value">${encomenda.clientes?.nome || "N/A"}</span></div>
              <div class="row"><span class="label">${t.supplier}:</span> <span class="value">${encomenda.fornecedores?.nome || "N/A"}</span></div>
              <div class="row"><span class="label">${t.status}:</span> <span class="value">${encomenda.status}</span></div>
              <div class="row"><span class="label">${isFelipe ? t.totalCost : t.total}:</span> <span class="value">${
                formatCurrency(isFelipe ? (encomenda.valor_total_custo ?? 0) : encomenda.valor_total)
              }</span></div>
              <div class="row"><span class="label">${t.paid}:</span> <span class="value">${formatCurrency(encomenda.valor_pago)}</span></div>
            </div>

            ${encomenda.observacoes ? `<div class="section"><div class="label">${t.notes}:</div><div>${encomenda.observacoes}</div></div>` : ""}
          </div>
        </body>
        </html>
      `;

      win.document.write(html);
      win.document.close();
      (win as any).onload = () => {
        (win as any).print();
        (win as any).onafterprint = () => (win as any).close();
      };
      toast.success(isHam ? "Fenêtre d’impression ouverte" : t.printOpened);
    } catch (e) {
      console.error("Erro ao imprimir:", e);
      toast.error(isHam ? "Erreur lors de l’ouverture de l’impression" : t.printError);
    }
  };

  const handleDelete = () => fetchEncomendas();

  const handleTransport = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setTransportDialogOpen(true);
  };

  /** Chamado pelo EncomendaStatusSelect ao salvar */
  const handleStatusChange = async () => {
    await fetchEncomendas();
  };

  /** Atualiza datas (produção/entrega) com regras de permissão */
  const handleDateUpdate = async (
    encomendaId: string,
    field: "data_producao_estimada" | "data_envio_estimada",
    value: string
  ) => {
    const canEditProduction = canEdit() || hasRole("factory") || isCollaborator;
    const canEditDelivery = canEdit() || isCollaborator;

    if (field === "data_producao_estimada" && !canEditProduction) {
      toast.error(isHam ? "Sans permission pour modifier la date de production" : "Sem permissão para editar data de produção");
      return;
    }
    if (field === "data_envio_estimada" && !canEditDelivery) {
      toast.error(isHam ? "Sans permission pour modifier la date de livraison" : "Sem permissão para editar data de entrega");
      return;
    }

    try {
      const { error } = await supabase.from("encomendas").update({ [field]: value || null }).eq("id", encomendaId);
      if (error) throw error;

      setEncomendas((prev) =>
        prev.map((enc) => (enc.id === encomendaId ? { ...enc, [field]: value || undefined } : enc))
      );

      const fieldName = field === "data_producao_estimada" ? (isHam ? "production" : "produção") : (isHam ? "livraison" : "entrega");
      toast.success(isHam ? `Date de ${fieldName} mise à jour` : `Data de ${fieldName} atualizada com sucesso`);
    } catch (e) {
      console.error("Erro ao atualizar data:", e);
      toast.error(isHam ? "Erreur lors de la mise à jour de la date" : "Erro ao atualizar data");
    }
  };

  /** Filtro de busca e status */
  const filteredEncomendas = encomendas.filter((encomenda) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      encomenda.numero_encomenda.toLowerCase().includes(q) ||
      (encomenda.clientes?.nome && encomenda.clientes.nome.toLowerCase().includes(q)) ||
      (encomenda.fornecedores?.nome && encomenda.fornecedores.nome.toLowerCase().includes(q)) ||
      (encomenda.etiqueta && encomenda.etiqueta.toLowerCase().includes(q));

    const matchesCompletedFilter = showCompleted ? encomenda.status === "ENTREGUE" : encomenda.status !== "ENTREGUE";
    const matchesStatusFilter = selectedStatus === "TODOS" || encomenda.status === selectedStatus;

    return matchesSearch && matchesCompletedFilter && matchesStatusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t.loadingOrders}</p>
        </div>
      </div>
    );
  }

  // flags de edição de datas na UI (Ham não edita)
  const canEditProductionUI = (canEdit() || hasRole("factory") || isCollaborator) && !isHam;
  const canEditDeliveryUI = (canEdit() || isCollaborator) && !isHam;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
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
                  {isHam ? "Créez une nouvelle commande en remplissant les champs ci-dessous." : "Crie uma nova encomenda preenchendo os dados abaixo."}
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
        {filteredEncomendas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{t.noOrders}</p>
            </CardContent>
          </Card>
        ) : (
          filteredEncomendas.map((encomenda) => (
            <Card key={encomenda.id} className="shadow-card transition-all duration-300 hover:shadow-hover">
              <CardContent className="p-6">
                {/* Linha 1 (grid 12 colunas): Pedido / Etiqueta / Cliente / Fornecedor / Ações */}
                <div className="grid grid-cols-12 gap-6 items-start mb-6">
                  {/* Pedido */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.order}</div>
                    <div className="font-bold text-lg text-primary-dark truncate">
                      #{encomenda.numero_encomenda}
                    </div>
                  </div>

                  {/* Etiqueta */}
                  {encomenda.etiqueta && (
                    <div className="col-span-6 sm:col-span-6 lg:col-span-2 min-w-0">
                      <div className="text-sm font-medium text-muted-foreground mb-1">{t.label}</div>
                      <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit truncate">
                        {encomenda.etiqueta}
                      </div>
                    </div>
                  )}

                  {/* Cliente */}
                  <div
                    className={`min-w-0 ${
                      encomenda.etiqueta
                        ? "col-span-12 sm:col-span-6 lg:col-span-3"
                        : "col-span-12 sm:col-span-6 lg:col-span-4"
                    }`}
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.client}</div>
                    <div className="text-sm font-semibold truncate">{encomenda.clientes?.nome || "N/A"}</div>
                  </div>

                  {/* Fornecedor */}
                  <div
                    className={`min-w-0 ${
                      encomenda.etiqueta
                        ? "col-span-12 sm:col-span-6 lg:col-span-3"
                        : "col-span-12 sm:col-span-6 lg:col-span-4"
                    }`}
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.supplier}</div>
                    <div className="text-sm font-medium text-muted-foreground truncate">
                      {encomenda.fornecedores?.nome || "N/A"}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="col-span-12 lg:col-span-2 flex items-center justify-start lg:justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => {
                        setSelectedEncomenda(encomenda);
                        setViewDialogOpen(true);
                      }}
                      aria-label={t.viewOrder}
                      title={t.viewOrder}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => handlePrint(encomenda)}
                      aria-label="Imprimir"
                      title="Imprimir"
                    >
                      <Printer className="h-5 w-5" />
                    </Button>
                    {canEdit() && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => {
                            setSelectedEncomenda(encomenda);
                            setEditDialogOpen(true);
                          }}
                          aria-label={t.editOrder}
                          title={t.editOrder}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <EncomendaActions
                          encomenda={encomenda}
                          onDelete={handleDelete}
                          onTransport={() => handleTransport(encomenda)}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Linha 2: detalhes com labels */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 items-start">
                  {/* Data Produção */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.productionDate}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!canEditProductionUI}
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !encomenda.data_producao_estimada && "text-muted-foreground",
                            !canEditProductionUI && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            {encomenda.data_producao_estimada
                              ? formatDate(encomenda.data_producao_estimada)
                              : t.select}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined
                          }
                          onSelect={(date) => {
                            if (!canEditProductionUI) return;
                            const dateString = date ? format(date, "yyyy-MM-dd") : "";
                            handleDateUpdate(encomenda.id, "data_producao_estimada", dateString);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Data Entrega */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.deliveryDate}</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!canEditDeliveryUI}
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !encomenda.data_envio_estimada && "text-muted-foreground",
                            !canEditDeliveryUI && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            {encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : t.select}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined}
                          onSelect={(date) => {
                            if (!canEditDeliveryUI) return;
                            const dateString = date ? format(date, "yyyy-MM-dd") : "";
                            handleDateUpdate(encomenda.id, "data_envio_estimada", dateString);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Peso Bruto */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.grossWeight}</div>
                    <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-center">
                      {pesoTransporte[encomenda.id]?.toFixed(2) || "0.00"} kg
                    </div>
                  </div>

                  {/* Valor Frete (estimado) */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.shippingValue}</div>
                    <div className="text-lg font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                      €{((pesoTransporte[encomenda.id] || 0) * 4.5).toFixed(2)}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.status}</div>
                    <EncomendaStatusSelect
                      encomendaId={encomenda.id}
                      currentStatus={encomenda.status}
                      numeroEncomenda={encomenda.numero_encomenda}
                      onStatusChange={handleStatusChange}
                    />
                  </div>

                  {/* Comissão — oculta para Felipe e Ham */}
                  {!(isFelipe || isHam) && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">{t.commission}</div>
                      <div
                        className={cn(
                          "text-lg font-bold px-3 py-2 rounded-lg text-center",
                          (encomenda.commission_amount || 0) >= 0
                            ? "text-green-600 bg-green-50"
                            : "text-red-600 bg-red-50"
                        )}
                      >
                        {formatCurrency(encomenda.commission_amount || 0)}
                      </div>
                    </div>
                  )}

                  {/* Total: custo para Felipe; venda para demais (inclui Ham) */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {isFelipe ? t.totalCost : t.total}
                    </div>
                    <div className="text-lg font-bold text-primary-dark bg-primary/10 px-3 py-2 rounded-lg text-center">
                      {formatCurrency(isFelipe ? (encomenda.valor_total_custo || 0) : encomenda.valor_total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: visualizar */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" key={selectedEncomenda?.id}>
          <DialogHeader>
            <DialogTitle>
              {t.viewOrder} #{selectedEncomenda?.numero_encomenda}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isHam ? "Détails complets de la commande sélectionnée." : "Detalhes completos da encomenda selecionada."}
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && <EncomendaView encomendaId={selectedEncomenda.id} />}
        </DialogContent>
      </Dialog>

      {/* Dialog: editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.editOrder} #{selectedEncomenda?.numero_encomenda}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isHam ? "Formulaire de modification de la commande sélectionnée." : "Formulário para editar os dados da encomenda selecionada."}
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaForm
              encomenda={selectedEncomenda}
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: transporte */}
      <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t.transportConfig} - #{selectedEncomenda?.numero_encomenda}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isHam ? "Paramètres et coûts de transport." : "Configurações e custos de transporte."}
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaTransportForm
              encomenda={selectedEncomenda}
              peso={pesoTransporte[selectedEncomenda.id] || 0}
              onSuccess={() => {
                setTransportDialogOpen(false);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
