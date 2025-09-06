import { useState, useEffect } from "react";
import { Plus, Search, CalendarIcon, Eye, Trash2, Edit, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { useFormatters } from "@/hooks/useFormatters";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EncomendaForm } from "@/components/EncomendaForm";
import { EncomendaView } from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  const queryClient = useQueryClient();
  const { canEdit, hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
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

  const fetchEncomendas = async () => {
    try {
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
        const encomendasWithCommission = await Promise.all(
          data.map(async (encomenda) => {
            const { data: itens, error: itensError } = await supabase
              .from("itens_encomenda")
              .select(`quantidade, preco_unitario, preco_custo`)
              .eq("encomenda_id", encomenda.id);

            let commission_amount = 0;
            let valor_total_custo = 0;
            if (!itensError && itens) {
              commission_amount = itens.reduce((total, item: any) => {
                const receita = item.quantidade * (item.preco_unitario || 0);
                const custo = item.quantidade * (item.preco_custo || 0);
                const lucro = receita - custo;
                return total + lucro;
              }, 0);
              
              valor_total_custo = itens.reduce((total, item: any) => {
                return total + (item.quantidade * (item.preco_custo || 0));
              }, 0);
            }

            return {
              ...encomenda,
              commission_amount,
              valor_total_custo
            };
          })
        );

        setEncomendas(encomendasWithCommission || []);

        const pesos: { [key: string]: number } = {};
        for (const encomenda of encomendasWithCommission) {
          const pesoCalculado = await calcularPesoTransporte(encomenda.id);
          pesos[encomenda.id] = pesoCalculado;
        }
        setPesoTransporte(pesos);
      }
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  const calcularPesoTransporte = async (encomendaId: string): Promise<number> => {
    try {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`quantidade, produtos(size_weight)`)
        .eq("encomenda_id", encomendaId);

      if (error || !itens) return 0;

      const pesoTotalGramas = itens.reduce((total, item: any) => {
        return total + (item.quantidade * (item.produtos?.size_weight || 0));
      }, 0);

      const pesoBrutoKg = (pesoTotalGramas * 1.30) / 1000;
      return pesoBrutoKg;
    } catch (error) {
      console.error("Erro ao calcular peso:", error);
      return 0;
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);
    const handlePrint = async (encomenda: Encomenda) => {
    try {
      console.log('[OrderPDF] Starting print for order:', encomenda.numero_encomenda);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error("Erro ao abrir janela de impressão");
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Encomenda #${encomenda.numero_encomenda}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 12px; line-height: 1.4; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; }
            ...
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Encomenda #${encomenda.numero_encomenda}</div>
            ${encomenda.etiqueta ? `<div class="subtitle">Etiqueta: ${encomenda.etiqueta}</div>` : ""}
            <div class="subtitle">Criada em ${formatDate(encomenda.data_criacao)}</div>
          </div>

          <!-- Resto da estrutura HTML da encomenda -->
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      };

      console.log('[OrderPDF] Print window opened successfully');
      toast.success("Janela de impressão aberta!");
    } catch (error) {
      console.error('[OrderPDF] Error opening print window:', error);
      toast.error("Erro ao abrir impressão");
    }
  };

  const handleDelete = () => {
    fetchEncomendas();
  };

  const handleTransport = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setTransportDialogOpen(true);
  };

  const handleStatusChange = async () => {
    fetchEncomendas();
  };

  const handleDateUpdate = async (encomendaId: string, field: string, value: string) => {
    const canEditProduction = canEdit() || hasRole('factory') || isCollaborator;
    const canEditDelivery = canEdit() || isCollaborator;

    if (field === 'data_producao_estimada' && !canEditProduction) {
      toast.error("Sem permissão para editar data de produção");
      return;
    }

    if (field === 'data_envio_estimada' && !canEditDelivery) {
      toast.error("Sem permissão para editar data de entrega");
      return;
    }

    try {
      const { error } = await supabase
        .from('encomendas')
        .update({ [field]: value || null })
        .eq('id', encomendaId);

      if (error) throw error;

      setEncomendas(prev => prev.map(enc =>
        enc.id === encomendaId ? { ...enc, [field]: value } : enc
      ));

      const fieldName = field === 'data_producao_estimada' ? 'produção' : 'entrega';
      toast.success(`Data de ${fieldName} atualizada com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  const filteredEncomendas = encomendas.filter(encomenda => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = encomenda.numero_encomenda.toLowerCase().includes(q) ||
      (encomenda.clientes?.nome && encomenda.clientes.nome.toLowerCase().includes(q)) ||
      (encomenda.fornecedores?.nome && encomenda.fornecedores.nome.toLowerCase().includes(q)) ||
      (encomenda.etiqueta && encomenda.etiqueta.toLowerCase().includes(q));

    const matchesCompletedFilter = showCompleted ? encomenda.status === 'ENTREGUE' : encomenda.status !== 'ENTREGUE';
    const matchesStatusFilter = selectedStatus === 'TODOS' || encomenda.status === selectedStatus;

    return matchesSearch && matchesCompletedFilter && matchesStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* ... seu JSX de retorno da página Encomendas ... */}
    </div>
  );
}


