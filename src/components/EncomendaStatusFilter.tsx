
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

type StatusEncomenda = "NOVO PEDIDO" | "PRODUÇÃO" | "EMBALAGEM" | "TRANSPORTE" | "ENTREGUE" | "TODOS";

interface EncomendaStatusFilterProps {
  selectedStatus: StatusEncomenda;
  onStatusChange: (status: StatusEncomenda) => void;
}

export function EncomendaStatusFilter({ selectedStatus, onStatusChange }: EncomendaStatusFilterProps) {
  const { user } = useAuth();
  const isHamAdmin = user?.email === 'ham@admin.com';

  const statusOptions = isHamAdmin ? [
    { value: "TODOS" as const, label: "Tous les statuts" },
    { value: "NOVO PEDIDO" as const, label: "Nouvelle demande" },
    { value: "PRODUÇÃO" as const, label: "Production" },
    { value: "EMBALAGEM" as const, label: "Emballage" },
    { value: "TRANSPORTE" as const, label: "Transport" },
    { value: "ENTREGUE" as const, label: "Livré" },
  ] : [
    { value: "TODOS" as const, label: "Todos os Status" },
    { value: "NOVO PEDIDO" as const, label: "Novo Pedido" },
    { value: "PRODUÇÃO" as const, label: "Produção" },
    { value: "EMBALAGEM" as const, label: "Embalagem" },
    { value: "TRANSPORTE" as const, label: "Transporte" },
    { value: "ENTREGUE" as const, label: "Entregue" },
  ];

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="status-filter">Filtrar por Status:</Label>
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger id="status-filter" className="w-48">
          <SelectValue placeholder="Selecione um status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
