/**
 * EncomendaCard - Componente de card individual para encomendas
 * Extraído de Encomendas.tsx para modularização
 */
import { memo } from "react";
import {
  Eye,
  Edit,
  User,
  Building2,
  CalendarIcon,
  Package,
  Truck,
  TrendingUp,
  CreditCard,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlassCard } from "@/components/shared";
import { EncomendaActions } from "./EncomendaActions";
import { EncomendaStatusSelect } from "./EncomendaStatusSelect";
import { cn } from "@/lib/utils";

import { StatusEncomenda } from "@/types/entities";

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
  peso_bruto?: number;
}

interface EncomendaCardProps {
  encomenda: Encomenda;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTransport: () => void;
  onStatusChange: () => void;
  onDateUpdate: (
    encomendaId: string,
    field: "data_producao_estimada" | "data_envio_estimada",
    value: string
  ) => void;
  // Permissions
  canEditOrders: boolean;
  canEditProduction: boolean;
  canEditDelivery: boolean;
  hidePrices: boolean;
  isHam: boolean;
  // Translations
  t: Record<string, string>;
  // Formatters
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
  // Data
  pesoTransporte: number;
}

function EncomendaCardComponent({
  encomenda: e,
  onView,
  onEdit,
  onDelete,
  onTransport,
  onStatusChange,
  onDateUpdate,
  canEditOrders,
  canEditProduction,
  canEditDelivery,
  hidePrices,
  isHam,
  t,
  formatCurrency,
  formatDate,
  pesoTransporte,
}: EncomendaCardProps) {
  const getStatusLabel = (status: StatusEncomenda): string => {
    if (!isHam) return status;
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

  return (
    <GlassCard className="bg-card relative overflow-hidden p-0" hoverEffect>
      {/* Ações Absolutas */}
      <div className="absolute top-4 right-4 z-10">
        <EncomendaActions
          encomenda={e as any}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onTransport={onTransport}
          canEditOrders={canEditOrders}
        />
      </div>

      <div className="p-4 sm:p-5">
        {/* Header: ID, Tag, Data e Status */}
        <div className="mb-3 flex items-center justify-between gap-2 pr-10">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-primary shrink-0 font-mono text-base font-bold sm:text-lg">
              #{e.numero_encomenda}
            </span>
            {e.etiqueta && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-blue-50 px-1.5 py-0 text-[10px] font-bold tracking-wide text-blue-700 uppercase sm:text-xs dark:bg-blue-900/30 dark:text-blue-300"
              >
                {e.etiqueta}
              </Badge>
            )}
            <span className="text-muted-foreground xs:inline hidden shrink-0 text-[10px] sm:text-xs">
              {formatDate(e.data_criacao)}
            </span>
          </div>

          {/* Status */}
          <div className="flex min-w-max shrink-0 justify-end">
            {isHam ? (
              <Badge
                variant="outline"
                className="w-full justify-center py-0.5 text-[10px] sm:text-xs"
              >
                {getStatusLabel(e.status)}
              </Badge>
            ) : (
              <EncomendaStatusSelect
                encomendaId={e.id}
                currentStatus={e.status}
                numeroEncomenda={e.numero_encomenda}
                onStatusChange={onStatusChange}
              />
            )}
          </div>
        </div>

        {/* Cliente e Fornecedor */}
        <div className="border-border/30 flex items-center justify-between gap-4 border-y py-2 text-xs sm:text-sm">
          <div className="xs:flex-row xs:items-center xs:gap-4 flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span className="text-muted-foreground shrink-0">{t.client}:</span>
              <span
                className="truncate font-medium text-foreground"
                title={e.clientes?.nome ?? e.cliente_nome ?? ""}
              >
                {e.clientes?.nome ?? e.cliente_nome ?? "—"}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Building2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span className="text-muted-foreground shrink-0">{t.supplier}:</span>
              <span
                className="truncate font-medium text-foreground"
                title={e.fornecedores?.nome ?? e.fornecedor_nome ?? ""}
              >
                {e.fornecedores?.nome ?? e.fornecedor_nome ?? "—"}
              </span>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="ml-2 flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onView}
              title="Visualizar"
              className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-cyan-500/10 hover:text-cyan-500 active:scale-90"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {canEditOrders && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title="Editar"
                className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-blue-500/10 hover:text-blue-500 active:scale-90"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Datas - Somente para não-Ham */}
        {!isHam && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs">
            {/* Data Produção */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-muted-foreground">{t.productionDate}:</span>
              {canEditProduction ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 font-medium text-foreground hover:bg-amber-500/10"
                    >
                      {e.data_producao_estimada
                        ? format(new Date(e.data_producao_estimada), "dd/MM/yy")
                        : "—"}
                      <CalendarIcon className="text-muted-foreground ml-1 h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        e.data_producao_estimada ? new Date(e.data_producao_estimada) : undefined
                      }
                      onSelect={(d) =>
                        onDateUpdate(
                          e.id,
                          "data_producao_estimada",
                          d ? format(d, "yyyy-MM-dd") : ""
                        )
                      }
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="font-medium text-foreground">
                  {e.data_producao_estimada
                    ? format(new Date(e.data_producao_estimada), "dd/MM/yy")
                    : "—"}
                </span>
              )}
            </div>

            {/* Data Entrega */}
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">{t.deliveryDate}:</span>
              {canEditDelivery ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 font-medium text-foreground hover:bg-green-500/10"
                    >
                      {e.data_envio_estimada
                        ? format(new Date(e.data_envio_estimada), "dd/MM/yy")
                        : "—"}
                      <CalendarIcon className="text-muted-foreground ml-1 h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={e.data_envio_estimada ? new Date(e.data_envio_estimada) : undefined}
                      onSelect={(d) =>
                        onDateUpdate(e.id, "data_envio_estimada", d ? format(d, "yyyy-MM-dd") : "")
                      }
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="font-medium text-foreground">
                  {e.data_envio_estimada
                    ? format(new Date(e.data_envio_estimada), "dd/MM/yy")
                    : "—"}
                </span>
              )}
            </div>

            {/* Peso */}
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-muted-foreground">{t.grossWeight}:</span>
              <span className="font-medium text-foreground">{pesoTransporte.toFixed(1)} kg</span>
            </div>
          </div>
        )}

        {/* Valores Financeiros */}
        {!hidePrices && (
          <div className="border-border/20 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-muted-foreground">{t.total}:</span>
              <span className="font-bold text-primary">{formatCurrency(e.valor_total || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">{t.paid}:</span>
              <span className="font-medium text-muted-foreground">{formatCurrency(e.valor_pago || 0)}</span>
            </div>
            {e.commission_amount !== undefined && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-muted-foreground">{t.commission}:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(e.commission_amount)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Memoizado para evitar re-renders desnecessários
export const EncomendaCard = memo(EncomendaCardComponent);
