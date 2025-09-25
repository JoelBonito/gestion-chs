import { useEffect, useState } from "react";
import { Plus, Edit, Archive, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { AmostraForm } from "@/components/AmostraForm";

interface Amostra {
  id: string;
  data: string;
  referencia: string;
  cliente_id?: string;
  projeto?: string;
  tipo_produto?: string;
  cor?: string;
  textura?: string;
  fragrancia?: string;
  ingredientes_adicionais?: string;
  quantidade_amostras: number;
  data_envio?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  clientes?: { nome: string };
}

export function AmostrasTab() {
  const { user } = useAuth();
  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAmostra, setEditingAmostra] = useState<Amostra | null>(null);

  // Check if user has access to amostras
  const hasAccess = user?.email && [
    'jbento1@gmail.com',
    'admin@admin.com',
    'rosa@colaborador.com',
    'felipe@colaborador.com'
  ].includes(user.email);

  const fetchAmostras = async () => {
    if (!hasAccess) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("amostras")
        .select(`
          *,
          clientes(nome)
        `)
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAmostras(data || []);
    } catch (error) {
      console.error("Erro ao carregar amostras:", error);
      toast.error("Erro ao carregar amostras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmostras();
  }, [hasAccess]);

  const handleDataEnvioUpdate = async (amostraId: string, newDate: string) => {
    try {
      const { error } = await supabase
        .from("amostras")
        .update({ data_envio: newDate || null })
        .eq("id", amostraId);

      if (error) throw error;

      setAmostras(prev =>
        prev.map(amostra =>
          amostra.id === amostraId
            ? { ...amostra, data_envio: newDate || undefined }
            : amostra
        )
      );

      toast.success("Data de envio atualizada");
    } catch (error) {
      console.error("Erro ao atualizar data de envio:", error);
      toast.error("Erro ao atualizar data de envio");
    }
  };

  const handleArchive = async (amostraId: string) => {
    try {
      const { error } = await supabase
        .from("amostras")
        .update({ archived: true })
        .eq("id", amostraId);

      if (error) throw error;

      setAmostras(prev => prev.filter(amostra => amostra.id !== amostraId));
      toast.success("Amostra arquivada");
    } catch (error) {
      console.error("Erro ao arquivar amostra:", error);
      toast.error("Erro ao arquivar amostra");
    }
  };

  const handleDelete = async (amostraId: string) => {
    try {
      const { error } = await supabase
        .from("amostras")
        .delete()
        .eq("id", amostraId);

      if (error) throw error;

      setAmostras(prev => prev.filter(amostra => amostra.id !== amostraId));
      toast.success("Amostra deletada");
    } catch (error) {
      console.error("Erro ao deletar amostra:", error);
      toast.error("Erro ao deletar amostra");
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingAmostra(null);
    fetchAmostras();
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta seção.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando amostras...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Amostras</h2>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingAmostra(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              PEDIR AMOSTRA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAmostra ? "Editar Amostra" : "Nova Amostra"}
              </DialogTitle>
            </DialogHeader>
            <AmostraForm
              amostra={editingAmostra}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Tipo de Produto</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amostras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma amostra encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                amostras.map((amostra) => (
                  <TableRow key={amostra.id}>
                    <TableCell>
                      {format(new Date(amostra.data), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {amostra.referencia}
                    </TableCell>
                    <TableCell>
                      {amostra.clientes?.nome || "N/A"}
                    </TableCell>
                    <TableCell>
                      {amostra.projeto || "N/A"}
                    </TableCell>
                    <TableCell>
                      {amostra.tipo_produto || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "justify-start text-left font-normal",
                              !amostra.data_envio && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {amostra.data_envio 
                              ? format(new Date(amostra.data_envio), "dd/MM/yyyy")
                              : "Selecionar"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={amostra.data_envio ? new Date(amostra.data_envio) : undefined}
                            onSelect={(date) => {
                              const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                              handleDataEnvioUpdate(amostra.id, dateStr);
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAmostra(amostra);
                            setDialogOpen(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(amostra.id)}
                          title="Arquivar"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar esta amostra? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(amostra.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}