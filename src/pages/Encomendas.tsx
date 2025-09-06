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
        // Calculate commission for each order
        const encomendasWithCommission = await Promise.all(
          data.map(async (encomenda) => {
            const { data: itens, error: itensError } = await supabase
              .from("itens_encomenda")
              .select(`
                quantidade,
                preco_unitario,
                preco_custo
              `)
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

        
        // Calcular peso para transporte de cada encomenda
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
        .select(`
          quantidade,
          produtos(size_weight)
        `)
        .eq("encomenda_id", encomendaId);

      if (error || !itens) return 0;

      // Calcular peso bruto: (quantidade * peso_unitário_em_gramas) * 1.30 / 1000 para kg
      const pesoTotalGramas = itens.reduce((total, item: any) => {
        return total + (item.quantidade * (item.produtos?.size_weight || 0));
      }, 0);

      // Multiplicar por 1.30 e converter para kg
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

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchEncomendas();
    // Invalidate commission queries to update dashboard
    queryClient.invalidateQueries({ queryKey: ['comissoes-mensais'] });
    queryClient.invalidateQueries({ queryKey: ['comissoes-anuais'] });
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
    // Invalidate commission queries to update dashboard
    queryClient.invalidateQueries({ queryKey: ['comissoes-mensais'] });
    queryClient.invalidateQueries({ queryKey: ['comissoes-anuais'] });
  };

  const handleTransportSuccess = () => {
    setTransportDialogOpen(false);
    setSelectedEncomenda(null);
    fetchEncomendas();
    // Invalidate commission queries to update dashboard
    queryClient.invalidateQueries({ queryKey: ['comissoes-mensais'] });
    queryClient.invalidateQueries({ queryKey: ['comissoes-anuais'] });
  };

  const handleEdit = (encomenda: Encomenda) => {
    console.log("Editando encomenda:", encomenda);
    setSelectedEncomenda(encomenda);
    setEditDialogOpen(true);
  };

  const handleView = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setViewDialogOpen(true);
  };

  const handlePrint = async (encomenda: Encomenda) => {
    try {
      console.log('[OrderPDF] Starting print for order:', encomenda.numero_encomenda);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error("Erro ao abrir janela de impressão");
        return;
      }

      // Create print-friendly HTML content
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
            .section { margin-bottom: 15px; }
            .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #333; }
            .grid { display: grid; gap: 10px; }
            .grid-2 { grid-template-columns: 1fr 1fr; }
            .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
            .field { }
            .field-label { font-size: 10px; color: #666; margin-bottom: 2px; }
            .field-value { font-weight: bold; }
            .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; background: #666; }
            .amount { font-size: 14px; font-weight: bold; }
            .amount.positive { color: #059669; }
            .amount.negative { color: #DC2626; }
            thead { display: table-header-group; }
            tbody { display: table-row-group; }
            tr { break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Encomenda #${encomenda.numero_encomenda}</div>
            ${encomenda.etiqueta ? `<div class="subtitle">Etiqueta: $${encomenda.etiqueta}</div>` : ''}
            <div class="subtitle">Criada em ${formatDate(encomenda.data_criacao)}</div>
          </div>

          <div class="section">
            <div class="grid grid-2">
              <div class="field">
                <div class="field-label">Cliente</div>
                <div class="field-value">${encomenda.clientes?.nome || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">Fornecedor</div>
                <div class="field-value">${encomenda.fornecedores?.nome || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="grid grid-3">
              <div class="field">
                <div class="field-label">Valor Total</div>
                <div class="field-value amount">${formatCurrency(encomenda.valor_total)}</div>
              </div>
              <div class="field">
                <div class="field-label">Valor Pago</div>
                <div class="field-value amount positive">${formatCurrency(encomenda.valor_pago)}</div>
              </div>
              <div class="field">
                <div class="field-label">Saldo Devedor</div>
                <div class="field-value amount negative">${formatCurrency(encomenda.valor_total - encomenda.valor_pago)}</div>
              </div>
            </div>
          </div>

          ${encomenda.data
