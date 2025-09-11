
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";

interface EncomendaStatusSelectProps {
  encomendaId: string;
  currentStatus: StatusEncomenda;
  numeroEncomenda: string;
  onStatusChange: () => void;
}

const getStatusOptions = (isHamAdmin: boolean): StatusEncomenda[] => [
  "NOVO PEDIDO",
  "PRODUÇÃO", 
  "EMBALAGEM",
  "TRANSPORTE",
  "ENTREGUE"
];

const getStatusLabel = (status: StatusEncomenda, isHamAdmin: boolean): string => {
  if (!isHamAdmin) return status;
  
  switch (status) {
    case "NOVO PEDIDO": return "Nouvelle demande";
    case "PRODUÇÃO": return "Production";
    case "EMBALAGEM": return "Emballage";
    case "TRANSPORTE": return "Transport";
    case "ENTREGUE": return "Livré";
    default: return status;
  }
};

const getStatusColor = (status: StatusEncomenda) => {
  switch (status) {
    case "NOVO PEDIDO": return "bg-gray-500";
    case "PRODUÇÃO": return "bg-blue-500";
    case "EMBALAGEM": return "bg-yellow-500";
    case "TRANSPORTE": return "bg-purple-500";
    case "ENTREGUE": return "bg-green-500";
    default: return "bg-gray-500";
  }
};

export function EncomendaStatusSelect({ 
  encomendaId, 
  currentStatus, 
  numeroEncomenda,
  onStatusChange 
}: EncomendaStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { isCollaborator } = useIsCollaborator();
  const { canEdit } = useUserRole();
  const { user } = useAuth();
  
  const isHamAdmin = user?.email === 'ham@admin.com';
  const STATUS_OPTIONS = getStatusOptions(isHamAdmin);
  
  // Allow collaborators and admins to change status
  const canChangeStatus = canEdit() || isCollaborator;

  const handleStatusChange = async (newStatus: StatusEncomenda) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      console.log("Atualizando status:", { encomendaId, newStatus, userEmail: await supabase.auth.getUser() });
      
      const { error } = await supabase
        .from("encomendas")
        .update({ status: newStatus })
        .eq("id", encomendaId);

      if (error) {
        console.error("Erro na atualização do status:", error);
        throw error;
      }

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
      <SelectTrigger className="w-auto border-none p-0 h-auto">
        <Badge className={`${getStatusColor(currentStatus)} text-white ${canChangeStatus ? 'hover:opacity-80 cursor-pointer' : 'opacity-60'}`}>
          {isUpdating ? (isHamAdmin ? "Mise à jour..." : "Atualizando...") : getStatusLabel(currentStatus, isHamAdmin)}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
              {getStatusLabel(status, isHamAdmin)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
