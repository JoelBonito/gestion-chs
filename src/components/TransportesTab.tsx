import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AttachmentManager } from "@/components/AttachmentManager";
import { Eye, Edit, Archive, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Transporte {
  id: string;
  tracking_number: string;
  referencia: string | null;
  created_at: string;
  created_by: string;
}

export function TransportesTab() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransporte, setEditingTransporte] = useState<Transporte | null>(null);
  const [novo, setNovo] = useState({ tracking_number: "", referencia: "" });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTransporte, setViewingTransporte] = useState<Transporte | null>(null);

  const fetchTransportes = async () => {
    const { data, error } = await supabase
      .from("transportes")
      .select("*")
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
  }, []);

  const handleSalvar = async () => {
    if (!novo.tracking_number) {
      toast.error("Tracking number é obrigatório");
      return;
    }

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
      fetchTransportes();
    }
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

  const handleDelete = async (transporte: Transporte) => {
    if (!confirm("Tem certeza que deseja deletar este transporte?")) return;

    const { error } = await supabase
      .from("transportes")
      .delete()
      .eq("id", transporte.id);

    if (error) {
      toast.error("Erro ao deletar transporte");
      console.error(error);
    } else {
      toast.success("Transporte deletado");
      fetchTransportes();
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
      {/* Header com botão Novo */}
      <div className="flex justify-end">
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" /> Novo Transporte
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
          <Card key={transporte.id}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-8 flex-1">
                  <div>
                    <span className="text-xs text-muted-foreground block">Tracking:</span>
                    <div className="font-semibold text-sm">#{transporte.tracking_number}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {transporte.referencia ? (
                      <>
                        <span className="text-xs text-muted-foreground block">Referência:</span>
                        <div className="text-sm truncate">{transporte.referencia}</div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">Sem referência</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 items-center shrink-0">
                  <Button 
                    size="sm"
                    onClick={() => handleTrackingClick(transporte.tracking_number)}
                    className="h-8"
                  >
                    Tracking
                  </Button>
                  <AttachmentManager 
                    entityType="transporte" 
                    entityId={transporte.id}
                    compact={true}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleView(transporte)}
                    title="Visualizar"
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
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
                    onClick={() => handleDelete(transporte)}
                    title="Deletar"
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog para criar/editar transporte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
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
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSalvar} className="flex-1">
                {editingTransporte ? "Atualizar" : "Salvar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar transporte */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Transporte</DialogTitle>
          </DialogHeader>
          {viewingTransporte && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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