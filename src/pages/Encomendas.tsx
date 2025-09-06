import { useState, useEffect } from "react";
import { Plus, Search, CalendarIcon, Eye, Edit, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { useFormatters } from "@/hooks/useFormatters";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { EncomendaForm } from "@/components/EncomendaForm";
import { EncomendaView } from "@/components/EncomendaView";
import { EncomendaActions } from "@/components/EncomendaActions";
import { EncomendaStatusFilter } from "@/components/EncomendaStatusFilter";
import { EncomendaTransportForm } from "@/components/EncomendaTransportForm";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect"; // <- seletor da versão antiga

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Tipos */
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

/** Componente principal */
export default function Encomendas() {
  const queryClient = useQueryClient(); // pode ser útil para invalidações futuras
  const { canEdit, hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
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

  /** Buscar encomendas + cálculos auxiliares */
  const fetchEncomendas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          *,
          clientes(nome),
          fornecedores(nome)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const encomendasWithComputed = await Promise.all(
          data.map(async (encomenda: any) => {
            // calcular comissão e custo total a partir dos itens
            const { data: itens, error: itensError } = await supabase
              .from("itens_encomenda")
              .select(`quantidade, preco_unitario, preco_custo`)
              .eq("encomenda_id", encomenda.id);

            let commission_amount = 0;
            let valor_total_custo = 0;

            if (!itensError && itens) {
              commission_amount = itens.reduce((total: number, item: any) => {
                const receita = Number(item.quantidade || 0) * Number(item.preco_unitario || 0);
                const custo = Number(item.quantidade || 0) * Number(item.preco_custo || 0);
                const lucro = receita - custo;
                return total + lucro;
              }, 0);

              valor_total_custo = itens.reduce((total: number, item: any) => {
                return total + Number(item.quantidade || 0) * Number(item.preco_custo || 0);
              }, 0);
            }

            return {
              ...encomenda,
              commission_amount,
              valor_total_custo,
            } as Encomenda;
          })
        );

        setEncomendas(encomendasWithComputed || []);

        // calcular pesos por encomenda (assíncrono em série para evitar throttling)
        const pesos: { [key: string]: number } = {};
        for (const enc of encomendasWithComputed) {
          const pesoCalculado = await calcularPesoTransporte(enc.id);
          pesos[enc.id] = pesoCalculado;
        }
        setPesoTransporte(pesos);
      }
    } catch (e) {
      console.error("Erro ao carregar encomendas:", e);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  /** Peso de transporte (usa size_weight em gramas e aplica 30% de margem) */
  const calcularPesoTransporte = async (encomendaId: string): Promise<number> => {
    try {
      const { data: itens, error } = await supabase
        .from("itens_encomenda")
        .select(`quantidade, produtos(size_weight)`)
        .eq("encomenda_id", encomendaId);

      if (error || !itens) return 0;

      const pesoTotalGramas = itens.reduce((total: number, item: any) => {
        const quantidade = Number(item.quantidade || 0);
        const sizeWeight = Number(item.produtos?.size_weight || 0);
        return total + quantidade * sizeWeight;
      }, 0);

      const pesoBrutoKg = (pesoTotalGramas * 1.3) / 1000;
      return pesoBrutoKg;
    } catch (e) {
      console.error("Erro ao calcular peso:", e);
      return 0;
    }
  };

  useEffect(() => {
    fetchEncomendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Impressão rápida */
  const handlePrint = async (encomenda: Encomenda) => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        toast.error("Erro ao abrir janela de impressão");
        return;
      }

      const html = `
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
            .content { margin: 20px 0; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; display: inline-block; width: 140px; }
            .value { display: inline-block; }
            .row { margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Encomenda #${encomenda.numero_encomenda}</div>
            ${encomenda.etiqueta ? `<div class="subtitle">Etiqueta: ${encomenda.etiqueta}</div>` : ""}
            <div class="subtitle">Criada em ${formatDate(encomenda.data_criacao)}</div>
          </div>

          <div class="content">
            <div class="section">
              <div class="row"><span class="label">Cliente:</span> <span class="value">${encomenda.clientes?.nome || "N/A"}</span></div>
              <div class="row"><span class="label">Fornecedor:</span> <span class="value">${encomenda.fornecedores?.nome || "N/A"}</span></div>
              <div class="row"><span class="label">Status:</span> <span class="value">${encomenda.status}</span></div>
              <div class="row"><span class="label">Valor Total:</span> <span class="value">${formatCurrency(encomenda.valor_total)}</span></div>
              <div class="row"><span class="label">Valor Pago:</span> <span class="value">${formatCurrency(encomenda.valor_pago)}</span></div>
            </div>

            ${
              encomenda.observacoes
                ? `<div class="section"><div class="label">Observações:</div><div>${encomenda.observacoes}</div></div>`
                : ""
            }
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
            Documento gerado em ${formatDate(new Date().toISOString())}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      (printWindow as any).onload = () => {
        (printWindow as any).print();
        (printWindow as any).onafterprint = () => (printWindow as any).close();
      };
      toast.success("Janela de impressão aberta");
    } catch (e) {
      console.error("Erro ao imprimir:", e);
      toast.error("Erro ao abrir impressão");
    }
  };

  /** Recarrega após exclusão */
  const handleDelete = () => {
    fetchEncomendas();
  };

  /** Abre diálogo de transporte */
  const handleTransport = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setTransportDialogOpen(true);
  };

  /** Chamado pelo EncomendaStatusSelect ao salvar */
  const handleStatusChange = async () => {
    await fetchEncomendas();
  };

  /** Atualiza datas (produção/entrega) com regras de permissão */
  const handleDateUpdate = async (encomendaId: string, field: "data_producao_estimada" | "data_envio_estimada", value: string) => {
    const canEditProduction = canEdit() || hasRole("factory") || isCollaborator;
    const canEditDelivery = canEdit() || isCollaborator;

    if (field === "data_producao_estimada" && !canEditProduction) {
      toast.error("Sem permissão para editar data de produção");
      return;
    }
    if (field === "data_envio_estimada" && !canEditDelivery) {
      toast.error("Sem permissão para editar data de entrega");
      return;
    }

    try {
      const { error } = await supabase.from("encomendas").update({ [field]: value || null }).eq("id", encomendaId);
      if (error) throw error;

      setEncomendas((prev) =>
        prev.map((enc) => (enc.id === encomendaId ? { ...enc, [field]: value || undefined } : enc))
      );

      const fieldName = field === "data_producao_estimada" ? "produção" : "entrega";
      toast.success(`Data de ${fieldName} atualizada com sucesso`);
    } catch (e) {
      console.error("Erro ao atualizar data:", e);
      toast.error("Erro ao atualizar data");
    }
  };

  /** Filtro de busca e status */
  const filteredEncomendas = encomendas.filter((encomenda) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      encomenda.numero_encomenda.toLowerCase().includes(q) ||
      (encomenda.clientes?.nome && encomenda.clientes.nome.toLowerCase().includes(q)) ||
      (encomenda.fornecedores?.nome && encomenda.fornecedores.nome.toLowerCase().includes(q)) ||
      (encomenda.etiqueta && encomenda.etiqueta.toLowerCase().includes(q));

    const matchesCompletedFilter = showCompleted ? encomenda.status === "ENTREGUE" : encomenda.status !== "ENTREGUE";
    const matchesStatusFilter = selectedStatus === "TODOS" || encomenda.status === selectedStatus;

    return matchesSearch && matchesCompletedFilter && matchesStatusFilter;
  });

  /** Loader */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando encomendas...</p>
        </div>
      </div>
    );
  }

  /** Render */
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gerencie suas encomendas</p>
        </div>

        {canEdit() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Encomenda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Encomenda</DialogTitle>
                <DialogDescription>Crie uma nova encomenda preenchendo os dados abaixo.</DialogDescription>
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

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente, fornecedor ou etiqueta..."
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
                <Label htmlFor="show-completed">Mostrar entregues</Label>
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
              <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredEncomendas.map((encomenda) => (
            <Card key={encomenda.id} className="shadow-card transition-all duration-300 hover:shadow-hover">
              <CardContent className="p-6">
                {/* Linha 1: dados principais e ações */}
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="min-w-0 mr-6">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Pedido</div>
                      <div className="font-bold text-lg text-primary-dark">#{encomenda.numero_encomenda}</div>
                    </div>

                    {encomenda.etiqueta && (
                      <div className="min-w-0 mr-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Etiqueta</div>
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {encomenda.etiqueta}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 mr-6">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Cliente</div>
                      <div className="text-sm font-semibold truncate">{encomenda.clientes?.nome || "N/A"}</div>
                    </div>

                    <div className="flex-1 min-w-0 mr-8">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Fornecedor</div>
                      <div className="text-sm font-medium text-muted-foreground truncate">
                        {encomenda.fornecedores?.nome || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => {
                        setSelectedEncomenda(encomenda);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => handlePrint(encomenda)}>
                      <Printer className="h-5 w-5" />
                    </Button>
                    {canEdit() && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => {
                            setSelectedEncomenda(encomenda);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <EncomendaActions
                          encomenda={encomenda}
                          onDelete={handleDelete}
                          onTransport={() => handleTransport(encomenda)}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Linha 2: detalhes com labels */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 items-start">
                  {/* Data Produção */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Data Produção</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !encomenda.data_producao_estimada && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            {encomenda.data_producao_estimada ? formatDate(encomenda.data_producao_estimada) : "Selecionar"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined
                          }
                          onSelect={(date) => {
                            const dateString = date ? format(date, "yyyy-MM-dd") : "";
                            handleDateUpdate(encomenda.id, "data_producao_estimada", dateString);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Data Entrega */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Data Entrega</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !encomenda.data_envio_estimada && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            {encomenda.data_envio_estimada ? formatDate(encomenda.data_envio_estimada) : "Selecionar"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined
                          }
                          onSelect={(date) => {
                            const dateString = date ? format(date, "yyyy-MM-dd") : "";
                            handleDateUpdate(encomenda.id, "data_envio_estimada", dateString);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Peso Bruto */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Peso Bruto</div>
                    <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-center">
                      {pesoTransporte[encomenda.id]?.toFixed(2) || "0.00"} kg
                    </div>
                  </div>

                  {/* Valor Frete (estimado) */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Valor Frete</div>
                    <div className="text-lg font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                      €{((pesoTransporte[encomenda.id] || 0) * 4.5).toFixed(2)}
                    </div>
                  </div>

                  {/* Status (multiopção restaurado) */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                    <EncomendaStatusSelect
                      encomendaId={encomenda.id}
                      currentStatus={encomenda.status}
                      numeroEncomenda={encomenda.numero_encomenda}
                      onStatusChange={handleStatusChange}
                    />
                  </div>

                  {/* Comissão */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Comissão</div>
                    <div
                      className={cn(
                        "text-lg font-bold px-3 py-2 rounded-lg text-center",
                        (encomenda.commission_amount || 0) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                      )}
                    >
                      {formatCurrency(encomenda.commission_amount || 0)}
                    </div>
                  </div>

                  {/* Valor Total */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Valor Total</div>
                    <div className="text-lg font-bold text-primary-dark bg-primary/10 px-3 py-2 rounded-lg text-center">
                      {formatCurrency(encomenda.valor_total)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: visualizar */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Encomenda #{selectedEncomenda?.numero_encomenda}</DialogTitle>
          </DialogHeader>
          {selectedEncomenda && <EncomendaView encomenda={selectedEncomenda} />}
        </DialogContent>
      </Dialog>

      {/* Dialog: editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Encomenda #{selectedEncomenda?.numero_encomenda}</DialogTitle>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaForm
              encomenda={selectedEncomenda}
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
            <DialogTitle>Configurar Transporte - #{selectedEncomenda?.numero_encomenda}</DialogTitle>
          </DialogHeader>
          {selectedEncomenda && (
            <EncomendaTransportForm
              encomenda={selectedEncomenda}
              peso={pesoTransporte[selectedEncomenda.id] || 0}
              onSuccess={() => {
                setTransportDialogOpen(false);
                fetchEncomendas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
