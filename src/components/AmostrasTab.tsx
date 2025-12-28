import { useEffect, useState } from "react";
import { Plus, Edit, Archive, Trash2, Calendar, Search, RotateCcw, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { AmostraForm } from "@/components/AmostraForm";
import AmostraView from "@/components/AmostraView";

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
  nome?: string;
}

export function AmostrasTab() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAmostra, setEditingAmostra] = useState<Amostra | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingAmostra, setViewingAmostra] = useState<Amostra | null>(null);

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
        .eq("archived", showArchived)
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
  }, [hasAccess, showArchived]);

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

  const handleReactivate = async (amostraId: string) => {
    try {
      const { error } = await supabase
        .from("amostras")
        .update({ archived: false })
        .eq("id", amostraId);

      if (error) throw error;

      setAmostras(prev => prev.filter(amostra => amostra.id !== amostraId));
      toast.success("Amostra reativada");
    } catch (error) {
      console.error("Erro ao reativar amostra:", error);
      toast.error("Erro ao reativar amostra");
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

  const filteredAmostras = amostras.filter((amostra) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      amostra.referencia.toLowerCase().includes(searchLower) ||
      (amostra.clientes?.nome || "").toLowerCase().includes(searchLower) ||
      (amostra.projeto || "").toLowerCase().includes(searchLower) ||
      (amostra.tipo_produto || "").toLowerCase().includes(searchLower)
    );
  });

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
    <div className="space-y-4">
      {/* Barra de Busca e Filtro */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-3 rounded-xl border border-border/10 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por referência, cliente, projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-input border border-border/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase placeholder:normal-case font-medium text-foreground"
          />
        </div>

        <div className="flex items-center gap-4 px-3 border-l border-border/50 h-8 shrink-0">
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label
              htmlFor="show-archived"
              className="cursor-pointer text-sm font-medium whitespace-nowrap text-foreground dark:text-white"
            >
              {showArchived ? "Mostrar Arquivados" : "Mostrar Ativos"}
            </Label>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingAmostra(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="gradient" className="h-9 active:scale-95 transition-all gap-1.5 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-cyan-500/20 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                {isMobile ? "Pedir" : "Pedir Amostra"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
              <DialogHeader className="bg-card border-b border-border/10">
                <DialogTitle>
                  {editingAmostra ? "Editar Amostra" : "Nova Amostra"}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <AmostraForm
                  amostra={editingAmostra}
                  onSuccess={handleFormSuccess}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block border border-border/10 bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card border-b border-border dark:border-white/10">
                <TableRow className="hover:bg-transparent border-border dark:border-white/5">
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Data</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Referência</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Cliente</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Projeto</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Tipo de Produto</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4">Data de Envio</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest py-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amostras.length === 0 ? (
                  <TableRow className="bg-card">
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhuma amostra encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  amostras.map((amostra) => (
                    <TableRow
                      key={amostra.id}
                      className="bg-card border-b border-border dark:border-white/5 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        setViewingAmostra(amostra);
                        setViewDialogOpen(true);
                      }}
                    >
                      <TableCell className="text-xs font-medium py-4">
                        {format(new Date(amostra.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-bold text-xs uppercase tracking-wide py-4">
                        {amostra.referencia}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-medium py-4">
                        {amostra.clientes?.nome || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-medium py-4">
                        {amostra.projeto || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-medium py-4">
                        {amostra.tipo_produto || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="gradient"
                              size="sm"
                              className={cn(
                                "justify-start text-left font-bold text-sm uppercase tracking-wider h-8 active:scale-95 transition-all shadow-sm",
                                !amostra.data_envio && "opacity-70"
                              )}
                            >
                              <Calendar className="mr-2 h-3.5 w-3.5" />
                              {amostra.data_envio
                                ? format(new Date(amostra.data_envio), "dd/MM/yyyy")
                                : "Selecionar"
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-[#1c202a] border-border/10 shadow-2xl" align="end">
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
                          {!showArchived ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingAmostra(amostra);
                                  setViewDialogOpen(true);
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10 hover:scale-110 active:scale-95 transition-all"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAmostra(amostra);
                                  setDialogOpen(true);
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:scale-110 active:scale-95 transition-all"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleArchive(amostra.id); }}
                                className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 hover:scale-110 active:scale-95 transition-all"
                                title="Arquivar"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleReactivate(amostra.id); }}
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 hover:scale-110 active:scale-95 transition-all"
                              title="Reativar"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all"
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
                                  className="bg-red-600 hover:bg-red-700 text-white border-none active:scale-95 transition-all"
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
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {amostras.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhuma amostra encontrada</p>
            </CardContent>
          </Card>
        ) : (
          amostras.map((amostra) => (
            <Card key={amostra.id} className="border border-border/10 bg-card overflow-hidden shadow-sm">
              <CardContent className="p-4 cursor-pointer" onClick={() => {
                setViewingAmostra(amostra);
                setViewDialogOpen(true);
              }}>
                <div className="space-y-3">
                  {/* Header with reference and date */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-tight">{amostra.referencia}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {format(new Date(amostra.data), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!showArchived ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingAmostra(amostra);
                              setViewDialogOpen(true);
                            }}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            onClick={(e) => { e.stopPropagation(); handleArchive(amostra.id); }}
                            title="Arquivar"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivate(amostra.id)}
                          title="Reativar"
                          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
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
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>{" "}
                      <span>{amostra.clientes?.nome || "N/A"}</span>
                    </div>
                    {amostra.projeto && (
                      <div>
                        <span className="text-muted-foreground">Projeto:</span>{" "}
                        <span>{amostra.projeto}</span>
                      </div>
                    )}
                    {amostra.tipo_produto && (
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>{" "}
                        <span>{amostra.tipo_produto}</span>
                      </div>
                    )}
                  </div>

                  {/* Data de Envio */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Data de Envio:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="gradient"
                          size="sm"
                          className={cn(
                            "text-sm uppercase font-bold tracking-wider h-7",
                            !amostra.data_envio && "opacity-70"
                          )}
                        >
                          <Calendar className="mr-1 h-3 w-3" />
                          {amostra.data_envio
                            ? format(new Date(amostra.data_envio), "dd/MM/yyyy")
                            : "Selecionar"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1c202a] border-border/10 shadow-2xl" align="end">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-border/50">
          <DialogHeader className="p-6 bg-card border-b border-border/10">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="h-6 w-6 text-primary" />
              Detalhes da Amostra
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {viewingAmostra && <AmostraView amostra={viewingAmostra} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}