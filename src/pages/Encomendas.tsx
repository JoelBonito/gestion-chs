// src/pages/Encomendas.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useFormatters } from "@/hooks/useFormatters";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import {
  EncomendaForm,
  EncomendaView,
  EncomendaStatusFilter,
  TransportesTab,
  TarefasTab,
  AmostrasTab,
  EncomendaList,
  EncomendaFilters
} from "@/components/encomendas";
import { useAuth } from "@/hooks/useAuth";
import { useEncomendaTranslation } from "@/hooks/useEncomendaTranslation";
import {
  isLimitedNav,
  shouldHidePrices,
  isReadonlyOrders,
  ROSA_ALLOWED_SUPPLIERS,
} from "@/lib/permissions";
import { PageContainer, GlassCard } from "@/components/shared";

import { StatusEncomenda } from "@/types/entities";

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

interface EncomendaDBRow extends Encomenda {
  itens_encomenda?: {
    quantidade: number | null;
    preco_unitario: number | null;
    preco_custo: number | null;
    produtos?: {
      size_weight: number | null;
    } | null;
  }[];
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

  const isRosa = email === "rosa@colaborador.com";

  // Check if user has access to amostras tab
  const hasAmostrasAccess =
    user?.email &&
    [
      "jbento1@gmail.com",
      "admin@admin.com",
      "rosa@colaborador.com",
      "felipe@colaborador.com",
    ].includes(user.email);

  const { t, isHam, getStatusLabel } = useEncomendaTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("TODOS");
  const [activeTab, setActiveTab] = useState<"encomendas" | "transportes" | "tarefas" | "amostras">(
    "encomendas"
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEncomendaForEdit, setSelectedEncomendaForEdit] = useState<Encomenda | null>(null);
  const [selectedEncomendaForView, setSelectedEncomendaForView] = useState<Encomenda | null>(null);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false); // Mantendo estado, embora form esteja nas actions

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesoTransporte, setPesoTransporte] = useState<Record<string, number>>({});

  const canEditProductionUI = (canEdit() || hasRole("factory") || isCollaborator) && !isHam;
  const canEditDeliveryUI = (canEdit() || isCollaborator) && !isHam;

  const fetchEncomendas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          *,
          clientes(nome),
          fornecedores(nome),
          itens_encomenda(
            quantidade,
            preco_unitario,
            preco_custo,
            produtos(nome, size_weight)
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const computed = (data || []).map((enc) => {
        let commission_amount = 0;
        let valor_total_custo = 0;
        let totalGramas = 0;

        ((enc as EncomendaDBRow).itens_encomenda || []).forEach((it) => {
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
          peso_bruto: (totalGramas * 1.3) / 1000, // kg
        } as Encomenda & { peso_bruto: number };
      });

      setEncomendas(computed);

      const pesos: Record<string, number> = {};
      computed.forEach((enc) => {
        pesos[enc.id] = enc.peso_bruto || 0;
      });
      setPesoTransporte(pesos);
    } catch (e) {
      console.error(e);
      toast.error(t.errLoad);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleSuccess = useCallback(() => {
    setDialogOpen(false);
    fetchEncomendas();
  }, [fetchEncomendas]);

  const handleEditSuccess = useCallback(() => {
    setSelectedEncomendaForEdit(null);
    fetchEncomendas();
  }, [fetchEncomendas]);

  useEffect(() => {
    // Aguarda autenticação antes de carregar dados
    if (authLoading) return;

    if (user?.email) {
      setUserEmail(user.email);
    }

    fetchEncomendas();
  }, [user, authLoading, fetchEncomendas]);

  const handleDateUpdate = async (
    encomendaId: string,
    field: "data_producao_estimada" | "data_envio_estimada",
    value: string
  ) => {
    if (
      (field === "data_producao_estimada" && !canEditProductionUI) ||
      (field === "data_envio_estimada" && !canEditDeliveryUI)
    ) {
      return;
    }
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ [field]: value || null })
        .eq("id", encomendaId);
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

  const scopedEncomendas =
    isFelipe || isRosa
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
        <Button variant="gradient" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t.newOrder}</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer title={t.orders} subtitle={t.manageOrders} actions={pageActions}>
      {/* Navegação Secundária (Abas) - Compacta no mobile */}
      <div className="border-border/40 no-scrollbar -mx-1 mb-4 flex overflow-x-auto border-b sm:mb-6">
        <button
          onClick={() => setActiveTab("encomendas")}
          className={cn(
            "border-b-2 px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm",
            activeTab === "encomendas"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-primary/80 border-transparent"
          )}
        >
          {t.orders}
        </button>
        {(isHam || !isRosaUser) && (
          <button
            onClick={() => setActiveTab("transportes")}
            className={cn(
              "border-b-2 px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm",
              activeTab === "transportes"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-primary/80 border-transparent"
            )}
          >
            {isHam ? "Transport" : "Transporte"}
          </button>
        )}
        {!isHam && !isRosaUser && (
          <button
            onClick={() => setActiveTab("tarefas")}
            className={cn(
              "border-b-2 px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm",
              activeTab === "tarefas"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-primary/80 border-transparent"
            )}
          >
            Tarefas
          </button>
        )}
        {hasAmostrasAccess && (
          <button
            onClick={() => setActiveTab("amostras")}
            className={cn(
              "border-b-2 px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:px-6 sm:py-3 sm:text-sm",
              activeTab === "amostras"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-primary/80 border-transparent"
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
          <EncomendaFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            showCompleted={showCompleted}
            onShowCompletedChange={setShowCompleted}
            translations={t}
          />

          {/* Lista de Encomendas */}
          <EncomendaList
            loading={loading || authLoading}
            encomendas={filteredEncomendas}
            onView={(e) => setSelectedEncomendaForView(e)}
            onEdit={(e) => setSelectedEncomendaForEdit(e)}
            onDelete={handleDelete}
            onTransport={() => setTransportDialogOpen(true)}
            onStatusChange={handleStatusChange}
            onDateUpdate={handleDateUpdate}
            canEditOrders={canEdit() && !isCollaborator && !readOnlyOrders}
            canEditProduction={canEditProductionUI}
            canEditDelivery={canEditDeliveryUI}
            hidePrices={hidePrices}
            isHam={isHam}
            t={t}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getPesoTransporte={(e) => pesoTransporte[e.id] || 0}
          />
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
      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.newOrder}</DialogTitle>
            <DialogDescription>{t.manageOrders}</DialogDescription>
          </DialogHeader>
          <EncomendaForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={!!selectedEncomendaForView}
        onOpenChange={(open) => !open && setSelectedEncomendaForView(null)}
      >
        <DialogContent className="bg-card max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.viewOrder} #{selectedEncomendaForView?.numero_encomenda}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <EncomendaView encomendaId={selectedEncomendaForView?.id} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!selectedEncomendaForEdit}
        onOpenChange={(open) => !open && setSelectedEncomendaForEdit(null)}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.editOrder} #{selectedEncomendaForEdit?.numero_encomenda}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedEncomendaForEdit && (
            <EncomendaForm
              encomenda={selectedEncomendaForEdit}
              isEditing={true}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
