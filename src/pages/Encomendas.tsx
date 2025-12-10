
// src/pages/Encomendas.tsx
import { useEffect, useState } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit, User, Building2, Package, Truck, TrendingUp, CreditCard, Filter, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useFormatters } from "@/hooks/useFormatters";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import EncomendaForm from "@/components/EncomendaForm";
import EncomendaView from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { TransportesTab } from "@/components/TransportesTab";
import { TarefasTab } from "@/components/TarefasTab";
import { AmostrasTab } from "@/components/AmostrasTab";
import { useAuth } from "@/hooks/useAuth";
import { isLimitedNav, shouldHidePrices, isReadonlyOrders, ROSA_ALLOWED_SUPPLIERS } from "@/lib/permissions";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

type StatusEncomenda = "NOVO PEDIDO" | "MATÉRIA PRIMA" | "PRODUÇÃO" | "EMBALAGENS" | "TRANSPORTE" | "ENTREGUE";
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
  cliente_id?: string;
  fornecedor_id?: string;
  clientes?: { nome: string | null } | null;
  fornecedores?: { nome: string | null } | null;
  cliente_nome?: string | null;
  fornecedor_nome?: string | null;
  commission_amount?: number;
  valor_total_custo?: number;
}

export default function Encomendas() {
  const { canEdit, hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { formatCurrency, formatDate } = useFormatters();
  const { user, loading: authLoading } = useAuth();

  // Permissões para Rosa
  const isRosaUser = isLimitedNav(user);
  const hidePrices = shouldHidePrices(user);
  const readOnlyOrders = isReadonlyOrders(user);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";

  const ALLOWED_SUPPLIERS_FOR_FELIPE = [
    "f0920a27-752c-4483-ba02-e7f32beceef6",
    "b8f995d2-47dc-4c8f-9779-ce21431f5244",
  ];

  const isHam = email === "ham@admin.com";
  const isRosa = email === "rosa@colaborador.com";

  // Check if user has access to amostras tab
  const hasAmostrasAccess = user?.email && [
    'jbento1@gmail.com',
    'admin@admin.com',
    'rosa@colaborador.com',
    'felipe@colaborador.com'
  ].includes(user.email);

  // Dicionário (FR para Ham, PT para demais)
  const t = isHam
    ? {
      orders: "Commandes",
      manageOrders: "Gérer vos commandes",
      newOrder: "Nouvelle commande",
      searchPlaceholder: "Rechercher...",
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
      viewOrder: "Voir",
      editOrder: "Modifier",
      transportConfig: "Transport",
      select: "Sélectionner",
      loadingOrders: "Chargement...",
      createdOn: "Créée le",
      errLoad: "Erreur lors du chargement",
      printOpened: "Fenêtre d’impression ouverte",
      printError: "Erreur lors de l’ouverture de l’impression",
    }
    : {
      orders: "Encomendas",
      manageOrders: "Visão geral e gestão de pedidos",
      newOrder: "Nova Encomenda",
      searchPlaceholder: "Buscar por nº, cliente, fornecedor...",
      showDelivered: "Exibir entregues",
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
      viewOrder: "Visualizar",
      editOrder: "Editar",
      transportConfig: "Transporte",
      select: "Selecionar",
      loadingOrders: "Carregando encomendas...",
      createdOn: "Criada em",
      errLoad: "Erro ao carregar encomendas",
      printOpened: "Janela de impressão aberta",
      printError: "Erro ao abrir impressão",
    };

  const getStatusLabel = (status: StatusEncomenda): string => {
    if (!isHam) return status;
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

  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("TODOS");
  const [activeTab, setActiveTab] = useState<"encomendas" | "transportes" | "tarefas" | "amostras">("encomendas");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEncomendaForEdit, setSelectedEncomendaForEdit] = useState<Encomenda | null>(null);
  const [selectedEncomendaForView, setSelectedEncomendaForView] = useState<Encomenda | null>(null);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false); // Mantendo estado, embora form esteja nas actions

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesoTransporte, setPesoTransporte] = useState<Record<string, number>>({});

  const canEditProductionUI = (canEdit() || hasRole("factory") || isCollaborator) && !isHam;
  const canEditDeliveryUI = (canEdit() || isCollaborator) && !isHam;

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("encomendas")
        .select(`
          *,
          clientes(nome),
          fornecedores(nome),
          itens_encomenda(
            quantidade,
            preco_unitario,
            preco_custo,
            produtos(nome, size_weight)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const computed = (data || []).map((enc: any) => {
        let commission_amount = 0;
        let valor_total_custo = 0;
        let totalGramas = 0;

        (enc.itens_encomenda || []).forEach((it: any) => {
          const q = Number(it.quantidade || 0);
          const pv = Number(it.preco_unitario || 0);
          const pc = Number(it.preco_custo || 0);
          const sw = Number(it.produtos?.size_weight || 0);

          commission_amount += q * pv - q * pc;
          valor_total_custo += q * pc;
          totalGramas += q * sw;
        });

        return {
          ...enc,
          commission_amount,
          valor_total_custo,
          peso_bruto: (totalGramas * 1.3) / 1000 // kg
        } as Encomenda & { peso_bruto: number };
      });

      setEncomendas(computed);

      const pesos: Record<string, number> = {};
      computed.forEach((enc: any) => {
        pesos[enc.id] = enc.peso_bruto || 0;
      });
      setPesoTransporte(pesos);
    } catch (e) {
      console.error(e);
      toast.error(t.errLoad);
    } finally {
      setLoading(false);
    }
  };

  const [userDataCached, setUserDataCached] = useState(false);

  useEffect(() => {
    // Aguarda autenticação antes de carregar dados
    if (authLoading) {
      return;
    }

    if (!userDataCached) {
      supabase.auth.getUser().then(({ data }) => {
        const fetchedEmail = data.user?.email ?? null;
        setUserEmail(fetchedEmail);
        setUserDataCached(true);
      });
    }
    fetchEncomendas();
  }, [userDataCached, authLoading]);

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

      toast.success("Atualizado / Mis à jour");
    } catch (e) {
      console.error(e);
      toast.error("Erro / Erreur");
    }
  };

  const handleStatusChange = async () => {
    await fetchEncomendas();
  };

  const handleDelete = () => fetchEncomendas();

  const scopedEncomendas = isFelipe || isRosa
    ? encomendas.filter((e) => ALLOWED_SUPPLIERS_FOR_FELIPE.includes(e.fornecedor_id ?? ""))
    : encomendas;

  const filteredEncomendas = scopedEncomendas.filter((e) => {
    const q = searchTerm.trim().toLowerCase();
    const byText =
      e.numero_encomenda.toLowerCase().includes(q) ||
      (e.etiqueta || "").toLowerCase().includes(q) ||
      (e.clientes?.nome || e.cliente_nome || "").toLowerCase().includes(q) ||
      (e.fornecedores?.nome || e.fornecedor_nome || "").toLowerCase().includes(q);

    const byDelivered = showCompleted ? e.status === "ENTREGUE" : e.status !== "ENTREGUE";
    const byStatus = selectedStatus === "TODOS" || e.status === selectedStatus;

    return byText && byDelivered && byStatus;
  });

  const pageActions = (
    <div className="flex items-center gap-2">
      {canEdit() && !readOnlyOrders && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t.newOrder}</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.newOrder}</DialogTitle>
              <DialogDescription>
                {t.manageOrders}
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
  );

  return (
    <PageContainer
      title={t.orders}
      subtitle={t.manageOrders}
      actions={pageActions}
    >
      {/* Navegação Secundária (Abas) */}
      <div className="flex border-b border-border/40 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("encomendas")}
          className={cn(
            "px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
            activeTab === "encomendas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
          )}
        >
          {t.orders}
        </button>
        {!isRosaUser && (
          <button
            onClick={() => setActiveTab("transportes")}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
              activeTab === "transportes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
          >
            {isHam ? "Transport" : "Transporte"}
          </button>
        )}
        {!isHam && !isRosaUser && (
          <button
            onClick={() => setActiveTab("tarefas")}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
              activeTab === "tarefas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
          >
            Tarefas
          </button>
        )}
        {hasAmostrasAccess && (
          <button
            onClick={() => setActiveTab("amostras")}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
              activeTab === "amostras"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
          >
            Amostras
          </button>
        )}
      </div>

      {activeTab === "encomendas" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filtros em Glass */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-white/60 dark:bg-card/40 backdrop-blur-sm border shadow-sm">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-black/20 border-border/50"
              />
            </div>

            <div className="md:col-span-4">
              <EncomendaStatusFilter selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
            </div>

            <div className="md:col-span-3 flex items-center justify-end gap-3 px-2">
              <div className="flex items-center space-x-2">
                <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
                <Label htmlFor="show-completed" className="text-sm cursor-pointer">{t.showDelivered}</Label>
              </div>
            </div>
          </div>

          {/* Lista de Encomendas */}
          <div className="space-y-4">
            {(loading || authLoading) ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
              </div>
            ) : filteredEncomendas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white/40 dark:bg-card/20 rounded-xl border border-dashed">
                <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">{t.noOrders}</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                  Tente ajustar os filtros ou crie uma nova encomenda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredEncomendas.map((e, index) => (
                  <GlassCard key={`${e.id}-${user?.email || 'loading'}`} className="p-0 overflow-hidden" hoverEffect>
                    <div className="p-5 space-y-5">
                      {/* Linha Superior: ID e Status */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex items-center flex-wrap gap-3">
                          <span className="text-lg font-bold font-mono text-primary">
                            #{e.numero_encomenda}
                          </span>
                          {e.etiqueta && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800">
                              {e.etiqueta}
                            </Badge>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground ml-1">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {formatDate(e.data_criacao)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Status */}
                          <div className="w-[150px]">
                            {isHam ? (
                              <Badge variant="outline" className="w-full justify-center py-1">
                                {getStatusLabel(e.status)}
                              </Badge>
                            ) : (
                              <EncomendaStatusSelect
                                encomendaId={e.id}
                                currentStatus={e.status}
                                numeroEncomenda={e.numero_encomenda}
                                onStatusChange={handleStatusChange}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info Principal: Clientes e Fornecedores */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">{t.client}</span>
                            <span className="text-sm font-medium truncate max-w-[200px]" title={e.clientes?.nome ?? e.cliente_nome ?? ""}>
                              {e.clientes?.nome ?? e.cliente_nome ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">{t.supplier}</span>
                            <span className="text-sm font-medium truncate max-w-[200px]" title={e.fornecedores?.nome ?? e.fornecedor_nome ?? ""}>
                              {e.fornecedores?.nome ?? e.fornecedor_nome ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé: Logística, Datas, Financeiro e Ações */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm w-full pt-2">

                        {/* 1. ESQUERDA: Datas */}
                        <div className="flex items-center gap-6 self-start sm:self-center">
                          {/* Data Entrega */}
                          <div className={cn("flex flex-col", !e.data_envio_estimada && "opacity-60")}>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">{t.deliveryDate}</span>
                            {canEditDeliveryUI ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-1 hover:text-primary font-medium transition-colors text-left group">
                                    <span>{e.data_envio_estimada ? formatDate(e.data_envio_estimada) : "Definir data"}</span>
                                    <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={e.data_envio_estimada ? new Date(e.data_envio_estimada) : undefined}
                                    onSelect={(d) => handleDateUpdate(e.id, "data_envio_estimada", d ? format(d, "yyyy-MM-dd") : "")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="font-medium">{e.data_envio_estimada ? formatDate(e.data_envio_estimada) : "—"}</span>
                            )}
                          </div>

                          {/* Data Produção */}
                          <div className={cn("flex flex-col", !e.data_producao_estimada && "opacity-60")}>
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">{t.productionDate}</span>
                            {canEditProductionUI ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-1 hover:text-primary font-medium transition-colors text-left group">
                                    <span>{e.data_producao_estimada ? formatDate(e.data_producao_estimada) : "Definir data"}</span>
                                    <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={e.data_producao_estimada ? new Date(e.data_producao_estimada) : undefined}
                                    onSelect={(d) => handleDateUpdate(e.id, "data_producao_estimada", d ? format(d, "yyyy-MM-dd") : "")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="font-medium">{e.data_producao_estimada ? formatDate(e.data_producao_estimada) : "—"}</span>
                            )}
                          </div>
                        </div>

                        {/* 2. CENTRO: Peso e Frete (Centralizados) */}
                        <div className="flex-1 flex items-center justify-center gap-6 w-full sm:w-auto border-y sm:border-y-0 border-border/30 py-2 sm:py-0">
                          {/* Peso */}
                          <div className="flex items-center gap-2" title={t.grossWeight}>
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {((e as any).peso_bruto || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                            </span>
                          </div>

                          {/* Frete */}
                          {!hidePrices && (
                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400" title={t.shippingValue}>
                              <Truck className="h-4 w-4" />
                              <span className="font-medium">
                                {formatCurrency((e as any).valor_frete || 0)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 3. DIREITA: Financeiro e Ações */}
                        <div className="flex items-center gap-4 justify-end w-full sm:w-auto">

                          {/* Separador e Grupo Financeiro */}
                          {!hidePrices && (
                            <>
                              <div className="h-8 w-px bg-border/40 hidden sm:block" />
                              <div className="flex flex-col items-end min-w-[100px]">
                                <span className="text-[10px] uppercase text-muted-foreground font-semibold leading-none mb-1">Total</span>
                                <div className="flex items-center gap-3">
                                  {/* Lucro Estimado / Comissão (Antes do Total) */}
                                  {!isFelipe && !hidePrices && (
                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Lucro Estimado">
                                      <TrendingUp className="h-3.5 w-3.5" />
                                      <span className="font-medium text-sm">
                                        {formatCurrency(e.commission_amount || 0)}
                                      </span>
                                    </div>
                                  )}
                                  {/* Valor Total */}
                                  <span className="font-bold text-lg text-foreground leading-none">
                                    {formatCurrency(isFelipe ? e.valor_total_custo || 0 : e.valor_total)}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Botões de Ação Simplificados (Apenas Menu) */}
                          <div className="flex items-center pl-2">
                            <EncomendaActions
                              encomenda={e as any}
                              onView={() => setSelectedEncomendaForView(e)}
                              onEdit={() => setSelectedEncomendaForEdit(e)}
                              onDelete={handleDelete}
                              onTransport={() => setTransportDialogOpen(true)}
                              canEditOrders={canEdit() && !isCollaborator && !readOnlyOrders}
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Abas Secundárias - Restauradas */}
      {activeTab === "transportes" && (
        <div className="mt-6">
          <TransportesTab />
        </div>
      )}

      {activeTab === "tarefas" && (
        <div className="mt-6">
          <TarefasTab />
        </div>
      )}

      {activeTab === "amostras" && (
        <div className="mt-6">
          <AmostrasTab />
        </div>
      )}

      {/* DIALOGS */}
      {/* View Dialog */}
      <Dialog open={!!selectedEncomendaForView} onOpenChange={(open) => !open && setSelectedEncomendaForView(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.viewOrder} #{selectedEncomendaForView?.numero_encomenda}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <EncomendaView encomendaId={selectedEncomendaForView?.id} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedEncomendaForEdit} onOpenChange={(open) => !open && setSelectedEncomendaForEdit(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editOrder} #{selectedEncomendaForEdit?.numero_encomenda}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedEncomendaForEdit && (
            <EncomendaForm
              encomenda={selectedEncomendaForEdit}
              isEditing={true}
              onSuccess={() => {
                setSelectedEncomendaForEdit(null);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

    </PageContainer>
  );
}
