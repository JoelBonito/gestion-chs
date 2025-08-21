
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE";

interface EncomendaStatusSelectProps {
  currentStatus: StatusEncomenda;
  onStatusChange: (newStatus: StatusEncomenda) => Promise<void> | void;
}

const STATUS_OPTIONS: StatusEncomenda[] = [
  "NOVO PEDIDO",
  "PRODUÇÃO", 
  "EMBALAGEM",
  "TRANSPORTE",
  "ENTREGUE"
];

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
  currentStatus, 
  onStatusChange 
}: EncomendaStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: StatusEncomenda) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select 
      value={currentStatus} 
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-auto border-none p-0 h-auto">
        <Badge className={`${getStatusColor(currentStatus)} text-white hover:opacity-80 cursor-pointer`}>
          {isUpdating ? "Atualizando..." : currentStatus}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
              {status}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
