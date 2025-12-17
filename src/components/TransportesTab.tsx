import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AttachmentManager } from "@/components/AttachmentManager";
import { Eye, Edit, Archive, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { archiveTransporte, reactivateTransporte } from "@/lib/soft-delete-actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Transporte {
  id: string;
  tracking_number: string;
  referencia: string | null;
  created_at: string;
  created_by: string;
  archived: boolean;
  archived_at: string | null;
  archived_reason: string | null;
}

export function TransportesTab() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransporte, setEditingTransporte] = useState<Transporte | null>(null);
  const [novo, setNovo] = useState({ tracking_number: "", referencia: "" });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTransporte, setViewingTransporte] = useState<Transporte | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransportes = async () => {
    const { data, error } = await supabase
      .from("transportes")
      .select("*")
      .eq("archived", showArchived)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar transportes");
      console.error(error);
    } else if (data) {
      setTransportes(data);
    }
  };

  useEffect(() => {
    fetchTransportes();
  }, [showArchived]);

  const handleSalvar = async () => {
    if (!novo.tracking_number) {
      toast.error("Tracking number é obrigatório");
      return;
    }

    setIsLoading(true);

    const data = {
      tracking_number: novo.tracking_number,
      referencia: novo.referencia || null,
    };

    let error;
    if (editingTransporte) {
      const { error: updateError } = await supabase
        .from("transportes")
        .update(data)
        .eq("id", editingTransporte.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("transportes")
        .insert([data]);
      error = insertError;
    }

    if (error) {
      toast.error("Erro ao salvar transporte");
      console.error(error);
    } else {
      toast.success(editingTransporte ? "Transporte atualizado" : "Transporte criado");
      setDialogOpen(false);
      setEditingTransporte(null);
      setNovo({ tracking_number: "", referencia: "" });
      setNovo({ tracking_number: "", referencia: "" });
      fetchTransportes();
    }
    setIsLoading(false);
  };

  const handleEdit = (transporte: Transporte) => {
    setEditingTransporte(transporte);
    setNovo({
      tracking_number: transporte.tracking_number,
      referencia: transporte.referencia || "",
    });
    setDialogOpen(true);
  };

  const handleView = (transporte: Transporte) => {
    setViewingTransporte(transporte);
    setViewDialogOpen(true);
  };

  const handleArchive = async (transporte: Transporte) => {
    if (!confirm("Tem certeza que deseja arquivar este transporte?")) return;

    setIsLoading(true);
    try {
      await archiveTransporte(transporte.id);
      fetchTransportes();
    } catch (error) {
      console.error("Erro ao arquivar transporte:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivate = async (transporte: Transporte) => {
    setIsLoading(true);
    try {
      await reactivateTransporte(transporte.id);
      fetchTransportes();
    } catch (error) {
      console.error("Erro ao reativar transporte:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openNewDialog = () => {
    setEditingTransporte(null);
    setNovo({ tracking_number: "", referencia: "" });
    setDialogOpen(true);
  };

  const handleTrackingClick = (trackingNumber: string) => {
    const url = `https://www.fedex.com/fedextrack/no-results-found?trknbr=${trackingNumber}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Header com botão Novo e toggle de arquivados */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label htmlFor="show-archived" className="cursor-pointer">
                  {showArchived ? "Mostrar arquivados" : "Mostrar ativos"}
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alterne para visualizar transportes {showArchived ? "ativos" : "arquivados"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button onClick={openNewDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Transporte</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Lista de transportes */}
      {transportes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum transporte encontrado. Clique em "Novo Transporte" para criar.
          </CardContent>
        </Card>
      ) : (
        transportes.map((transporte) => (
          <Card
            key={transporte.id}
            className={`overflow-hidden ${transporte.archived ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 flex-1 min-w-0">
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground block">Tracking:</span>
                    <div className="font-semibold text-sm truncate">#{transporte.tracking_number}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground block">Referência:</span>
                    <div className="text-sm truncate">{transporte.referencia || "Sem referência"}</div>
                  </div>
                  {transporte.archived && (
                    <Badge variant="secondary" className="shrink-0">
                      ARQUIVADO
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {!transporte.archived && (
                    <Button
                      size="sm"
                      onClick={() => handleTrackingClick(transporte.tracking_number)}
                      className="w-full sm:w-auto"
                    >
                      Tracking
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(transporte)}
                      title="Visualizar"
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!transporte.archived && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transporte)}
                          title="Editar"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchive(transporte)}
                          title="Arquivar"
                          className="text-warning hover:text-warning/80 h-8 w-8"
                          disabled={isLoading}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {transporte.archived && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReactivate(transporte)}
                        title="Reativar"
                        className="text-success hover:text-success/80 h-8 w-8"
                        disabled={isLoading}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog para criar/editar transporte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransporte ? "Editar Transporte" : "Novo Transporte"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tracking Number *</label>
              <Input
                placeholder="Digite o número de rastreamento"
                value={novo.tracking_number}
                onChange={(e) => setNovo((n) => ({ ...n, tracking_number: e.target.value }))}
                pattern="[A-Za-z0-9]*"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Referência</label>
              <Input
                placeholder="Referência ou observação"
                value={novo.referencia}
                onChange={(e) => setNovo((n) => ({ ...n, referencia: e.target.value }))}
              />
            </div>
            {!editingTransporte && (
              <p className="text-sm text-muted-foreground">
                Após salvar, você poderá anexar arquivos PDF/JPEG.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleSalvar} className="w-full sm:flex-1" disabled={isLoading}>
                {isLoading ? (editingTransporte ? "Atualizando..." : "Salvando...") : (editingTransporte ? "Atualizar" : "Salvar")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="w-full sm:flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar transporte */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Transporte</DialogTitle>
          </DialogHeader>
          {viewingTransporte && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tracking Number
                  </label>
                  <div className="text-lg font-semibold">#{viewingTransporte.tracking_number}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Referência
                  </label>
                  <div>{viewingTransporte.referencia || "Sem referência"}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Data de Criação
                  </label>
                  <div>{new Date(viewingTransporte.created_at).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <AttachmentManager
                  entityType="transporte"
                  entityId={viewingTransporte.id}
                  title="Anexos do Transporte"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}