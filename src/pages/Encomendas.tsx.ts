// src/pages/Encomendas.tsx
import { useEffect, useState } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit } from "lucide-react";
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
import EncomendaView from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { TransportesTab } from "@/components/TransportesTab";
import { TarefasTab } from "@/components/TarefasTab";

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
  const isHam = email === "ham@admin.com";

  // Fornecedores permitidos para o Felipe (UUIDs)
  const ALLOWED_SUPPLIERS_FOR_FELIPE = [
    "f0920a27-752c-4483-ba02-e7f32beceef6",
    "b8f995d2-47dc-4c8f-9779-ce21431f5244",
  ];

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
        printOpened: "Fenêtre d'impression ouverte",
        printError: "Erreur lors de l'ouverture de l'impression",
        tasks: "Tâches",
        transport: "Transport",
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
        tasks: "Tarefas",
        transport: "Transporte",
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
  const [activeTab, setActiveTab] = useState<"encomendas" | "transportes" | "tarefas">("encomendas");

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

  // Determinar abas visíveis (Tarefas não visível para Ham)
  const availableTabs = [
    { key: "encomendas", label: t.orders },
    { key: "transportes", label: t.transport },
    ...(isHam ? [] : [{ key: "tarefas", label: t.tasks }]),
  ];

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
    // Proteção adicional – (para Ham, UI já fica não-interativa)
    if ((field === "data_producao_estimada" && !canEditProductionUI) || (field === "data_envio_estimada" && !canEditDeliveryUI)) {
      return;
    }
    try {
      const { error } = await supabase.from("encomendas").update({ [field]: value || null }).eq("id", encomendaId);
      if (error) throw error;

      setEncomendas((prev) =>
        prev.map((enc) => (enc.id === encomendaId ? { ...enc, [field]: value || null } : enc))
      );
}

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
                    <div className="col