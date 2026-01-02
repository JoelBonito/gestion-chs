import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { PushNotifications } from "@/lib/push-notifications";

import { StatusEncomenda } from "@/types/entities";

interface EncomendaStatusSelectProps {
  encomendaId: string;
  currentStatus: StatusEncomenda;
  numeroEncomenda: string;
  onStatusChange: () => void;
}

const getStatusOptions = (isHamAdmin: boolean): StatusEncomenda[] => [
  "NOVO PEDIDO",
  "MATÉRIA PRIMA",
  "PRODUÇÃO",
  "EMBALAGENS",
  "TRANSPORTE",
  "ENTREGUE",
];

const getStatusLabel = (status: StatusEncomenda, isHamAdmin: boolean): string => {
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

const getStatusColor = (status: StatusEncomenda) => {
  switch (status) {
    case "NOVO PEDIDO":
      return "bg-blue-600"; // Azul vibrante para novos pedidos
    case "MATÉRIA PRIMA":
      return "bg-orange-500"; // Laranja para aviso/espera
    case "PRODUÇÃO":
      return "bg-sky-500"; // Azul claro para produção
    case "EMBALAGENS":
      return "bg-emerald-500"; // Verde esmeralda para diferenciação
    case "TRANSPORTE":
      return "bg-purple-600";
    case "ENTREGUE":
      return "bg-green-600";
    default:
      return "bg-muted";
  }
};

const getStatusTooltip = (status: StatusEncomenda): string | null => {
  switch (status) {
    case "MATÉRIA PRIMA":
      return "compra e preparação das matérias primas";
    case "PRODUÇÃO":
      return "produção e envase dos produtos";
    case "EMBALAGENS":
      return "rotulagem e montagem dos paletes";
    default:
      return null;
  }
};

const getStatusWithIcon = (status: StatusEncomenda, isHamAdmin: boolean) => {
  const tooltip = getStatusTooltip(status);
  const label = getStatusLabel(status, isHamAdmin);

  if (!tooltip) {
    return <span>{label}</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export function EncomendaStatusSelect({
  encomendaId,
  currentStatus,
  numeroEncomenda,
  onStatusChange,
}: EncomendaStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { isCollaborator } = useIsCollaborator();
  const { canEdit } = useUserRole();
  const { user } = useAuth();

  const isHamAdmin = user?.email === "ham@admin.com";
  const STATUS_OPTIONS = getStatusOptions(isHamAdmin);

  // Allow collaborators and admins to change status
  const canChangeStatus = canEdit() || isCollaborator;

  const handleStatusChange = async (newStatus: StatusEncomenda) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      console.log("Atualizando status:", {
        encomendaId,
        newStatus,
        userEmail: await supabase.auth.getUser(),
      });

      const { error } = await supabase
        .from("encomendas")
        .update({ status: newStatus as any })
        .eq("id", encomendaId);

      if (error) {
        console.error("Erro na atualização do status:", error);
        throw error;
      }

      // Enviar notificação por email
      try {
        // Buscar dados da encomenda para incluir etiqueta
        const { data: encomenda } = await supabase
          .from("encomendas")
          .select("etiqueta")
          .eq("id", encomendaId)
          .single();

        const etiqueta = encomenda?.etiqueta || "N/A";

        await sendEmail(
          emailRecipients.geral,
          `📦 Status atualizado — ${numeroEncomenda}`,
          emailTemplates.mudancaStatus(numeroEncomenda, etiqueta, newStatus)
        );
      } catch (emailError) {
        console.error("Erro ao enviar email de notificação:", emailError);
        // Não exibir erro de email para não atrapalhar o fluxo principal
      }

      // Enviar push notification
      PushNotifications.statusAlterado(numeroEncomenda, newStatus).catch(() => { });

      toast.success(`Status da encomenda ${numeroEncomenda} atualizado para ${newStatus}`);
      onStatusChange();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da encomenda");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating || !canChangeStatus}
    >
      <SelectTrigger className="h-auto w-auto border-none p-0 ring-0 focus:ring-0">
        <Badge
          className={`${getStatusColor(currentStatus)} min-w-[155px] justify-center py-1.5 whitespace-nowrap text-primary-foreground ${canChangeStatus ? "cursor-pointer hover:brightness-110 active:scale-95" : "opacity-70"} text-[10px] font-bold tracking-wider uppercase shadow-sm transition-all duration-200`}
        >
          {isUpdating
            ? isHamAdmin
              ? "Mise à jour..."
              : "Atualizando..."
            : getStatusWithIcon(currentStatus, isHamAdmin)}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-lg ${getStatusColor(status)}`} />
              {getStatusWithIcon(status, isHamAdmin)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
