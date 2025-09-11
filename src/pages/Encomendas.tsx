// src/pages/Encomendas.tsx
import { useEffect, useState } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useFormatters } from "@/hooks/useFormatters";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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

import EncomendaForm from "@/components/EncomendaForm";
import EncomendaView from "@/components/EncomendaView"; // IMPORT DEFAULT (correto)
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { TransportesTab } from "@/components/TransportesTab";

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
  cliente_id?: string;
  fornecedor_id?: string;
  clientes?: { nome: string | null } | null;
  fornecedores?: { nome: string | null } | null;
  // calculados no front:
  commission_amount?: number;
  valor_total_custo?: number;
}

export default function Encomendas() {
  const { canEdit, hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { formatCurrency, formatDate } = useFormatters();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";

// Fornecedores permitidos para o Felipe (UUIDs)
const ALLOWED_SUPPLIERS_FOR_FELIPE = [
  "f0920a27-752c-4483-ba02-e7f32beceef6",
  "b8f995d2-47dc-4c8f-9779-ce21431f5244",
];

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

  // Function to get status label in correct language
  const getStatusLabel = (status: StatusEncomenda): string => {
    if (!isHam) return status;
    
    switch (status) {
      case "NOVO PEDIDO": return "Nouvelle demande";
      case "PRODUÇÃO": return "Production";
      case "EMBALAGEM": return "Emballage";
      case "TRANSPORTE": return "Transport";
      case "ENTREGUE": return "Livré";
      default: return status;
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("TODOS");
  const [activeTab, setActiveTab] = useState<"encomendas" | "transportes">("encomendas");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);

  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesoTransporte, setPesoTransporte] = useState<Record<string, number>>({});

  // flags de edição de datas na UI (Ham não edita; visual normal)
  const canEditProductionUI = (canEdit() || hasRole("factory") || isCollaborator) && !isHam;
  const canEditDeliveryUI = (canEdit() || isCollaborator) && !isHam;

  // Busca encomendas e computa comissão/custo total - OTIMIZADA
  const fetchEncomendas = async () => {
    try {
      setLoading(true);

      // Query otimizada: buscar encomendas com dados calculados de uma vez
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
            produtos(size_weight)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100); // Limitar resultados iniciais

      if (error) throw error;

      // Processar dados em batch ao invés de queries individuais
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

      // Criar mapa de pesos sem queries adicionais
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

  // Cache do usuário para evitar múltiplas chamadas
  const [userDataCached, setUserDataCached] = useState(false);
  
  useEffect(() => {
    if (!userDataCached) {
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email ?? null);
        setUserDataCached(true);
      });
    }
    fetchEncomendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDataCached]);

  const handleDateUpdate = async (
    encomendaId: string,
    field: "data_producao_estimada" | "data_envio_estimada",
    value: string
  ) => {
    // Proteção adicional — (para Ham, UI já fica não-interativa)
    if ((field === "data_producao_estimada" && !canEditProductionUI) || (field === "data_envio_estimada" && !canEditDeliveryUI)) {
      return;
    }
    try {
      const { error } = await supabase.from("encomendas").update({ [field]: value || null }).eq("id", encomendaId);
      if (error) throw error;

      setEncomendas((prev) =>
        prev.map((enc) => (enc.id === encomendaId ? { ...enc, [field]: value || null } : enc))
      );

      const fieldName = isHam
        ? field === "data_producao_estimada"
          ? "production"
          : "livraison"
        : field === "data_producao_estimada"
        ? "produção"
        : "entrega";
      toast.success(isHam ? `Date de ${fieldName} mise à jour` : `Data de ${fieldName} atualizada`);
    } catch (e) {
      console.error(e);
      toast.error(isHam ? "Erreur lors de la mise à jour" : "Erro ao atualizar data");
    }
  };

  const handleStatusChange = async () => {
    await fetchEncomendas();
  };

  const handlePrint = (enc: Encomenda) => {
    window.open(`/print-encomenda?id=${enc.id}`, "_blank");
  };

  const handleDelete = () => fetchEncomendas();
  const handleTransport = (e: Encomenda) => {
    setSelectedEncomenda(e);
    setTransportDialogOpen(true);
  };

  // Filtros
  // Escopo de fornecedores (reforço em memória para Felipe)
const scopedEncomendas = isFelipe
  ? encomendas.filter((e) => ALLOWED_SUPPLIERS_FOR_FELIPE.includes(e.fornecedor_id ?? ""))
  : encomendas;

const filteredEncomendas = scopedEncomendas.filter((e) => {
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
      <div className="space-y-6">
        {/* Skeleton do cabeçalho */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Skeleton dos filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1 max-w-sm" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Skeleton das encomendas */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="col-span-3">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="col-span-3">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-5 w-28" />
                    </div>
                    <div className="col-span-4 flex gap-2 justify-end">
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-12 mb-2" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

      {/* Abas */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          onClick={() => setActiveTab("encomendas")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "encomendas" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.orders}
        </button>
        <button
          onClick={() => setActiveTab("transportes")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "transportes" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isHam ? "Transport" : "Transporte"}
        </button>
      </div>

      {activeTab === "encomendas" && (
        <>
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
          filteredEncomendas.map((e) => (
            <Card key={e.id} className="shadow-card transition-all duration-300 hover:shadow-hover">
              <CardContent className="p-6">
                {/* Linha 1: Pedido / Etiqueta / Cliente / Fornecedor / Ações */}
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
                  <div
                    className={`min-w-0 ${
                      e.etiqueta ? "col-span-12 sm:col-span-6 lg:col-span-3" : "col-span-12 sm:col-span-6 lg:col-span-4"
                    }`}
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.client}</div>
                    <div className="text-sm font-semibold truncate">{e.clientes?.nome ?? "N/A"}</div>
                  </div>

                  {/* Fornecedor */}
                  <div
                    className={`min-w-0 ${
                      e.etiqueta ? "col-span-12 sm:col-span-6 lg:col-span-3" : "col-span-12 sm:col-span-6 lg:col-span-4"
                    }`}
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-1">{t.supplier}</div>
                    <div className="text-sm font-medium text-muted-foreground truncate">{e.fornecedores?.nome ?? "N/A"}</div>
                  </div>

                  {/* Ações */}
                  <div className="col-span-12 lg:col-span-2 flex items-center justify-start lg:justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => {
                        setSelectedEncomenda(e);
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
                      onClick={() => handlePrint(e)}
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
                            setSelectedEncomenda(e);
                            setEditDialogOpen(true);
                          }}
                          aria-label={t.editOrder}
                          title={t.editOrder}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <EncomendaActions encomenda={e as any} onDelete={handleDelete} onTransport={() => handleTransport(e)} />
                      </>
                    )}
                  </div>
                </div>

                {/* Linha 2: detalhes */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 items-start">
                  {/* Data Produção */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.productionDate}</div>

                    {canEditProductionUI ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              !e.data_producao_estimada && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                              {e.data_producao_estimada ? formatDate(e.data_producao_estimada) : t.select}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={e.data_producao_estimada ? new Date(e.data_producao_estimada) : undefined}
                            onSelect={(date) => {
                              const v = date ? format(date, "yyyy-MM-dd") : "";
                              handleDateUpdate(e.id, "data_producao_estimada", v);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      // “Fake button” (mesmo visual do outline), mas não clicável
                      <div
                        aria-disabled
                        className={cn(
                          "w-full h-10 inline-flex items-center justify-start rounded-md border bg-background",
                          "px-3 py-2 text-sm font-normal text-left"
                        )}
                        title={t.productionDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {e.data_producao_estimada ? formatDate(e.data_producao_estimada) : t.select}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Data Entrega */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.deliveryDate}</div>

                    {canEditDeliveryUI ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10",
                              !e.data_envio_estimada && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                              {e.data_envio_estimada ? formatDate(e.data_envio_estimada) : t.select}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={e.data_envio_estimada ? new Date(e.data_envio_estimada) : undefined}
                            onSelect={(date) => {
                              const v = date ? format(date, "yyyy-MM-dd") : "";
                              handleDateUpdate(e.id, "data_envio_estimada", v);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div
                        aria-disabled
                        className={cn(
                          "w-full h-10 inline-flex items-center justify-start rounded-md border bg-background",
                          "px-3 py-2 text-sm font-normal text-left"
                        )}
                        title={t.deliveryDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {e.data_envio_estimada ? formatDate(e.data_envio_estimada) : t.select}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Peso Bruto */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.grossWeight}</div>
                    <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-center">
                      {(pesoTransporte[e.id] ?? 0).toFixed(2)} kg
                    </div>
                  </div>

                  {/* Valor Frete (estimado) */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.shippingValue}</div>
                    <div className="text-lg font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                      {formatCurrency(((pesoTransporte[e.id] ?? 0) * 4.5) || 0)}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t.status}</div>

                    {isHam ? (
                      // Pill estático (não clicável) com o status atual em francês
                      <div className="inline-flex items-center px-3 h-10 rounded-md border bg-background text-sm font-medium">
                        {getStatusLabel(e.status)}
                      </div>
                    ) : (
                      <EncomendaStatusSelect
                        encomendaId={e.id}
                        currentStatus={e.status}
                        numeroEncomenda={e.numero_encomenda}
                        onStatusChange={handleStatusChange}
                      />
                    )}
                  </div>

                  {/* Comissão — oculta para Felipe e Ham */}
                  {!(isFelipe || isHam) && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">{t.commission}</div>
                      <div
                        className={cn(
                          "text-lg font-bold px-3 py-2 rounded-lg text-center",
                          (e.commission_amount || 0) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                        )}
                      >
                        {formatCurrency(e.commission_amount || 0)}
                      </div>
                    </div>
                  )}

                  {/* Total: custo p/ Felipe; venda p/ demais (inclui Ham) */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {isFelipe ? t.totalCost : t.total}
                    </div>
                    <div className="text-lg font-bold text-primary-dark bg-primary/10 px-3 py-2 rounded-lg text-center">
                      {formatCurrency(isFelipe ? e.valor_total_custo || 0 : e.valor_total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: visualizar (PASSA SÓ O ID — evita eq.[object Object]) */}
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
              {isHam
                ? "Formulaire de modification de la commande sélectionnée."
                : "Formulário para editar os dados da encomenda selecionada."}
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaForm
              encomenda={selectedEncomenda}
              isEditing={true}
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
              encomendaId={selectedEncomenda.id}
              onSuccess={() => {
                setTransportDialogOpen(false);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
        </>
      )}

      {activeTab === "transportes" && (
        <TransportesTab />
      )}
    </div>
  );
}
