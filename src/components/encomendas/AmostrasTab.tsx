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

import { AmostraForm } from "./AmostraForm";
import AmostraView from "./AmostraView";

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
  const hasAccess =
    user?.email &&
    [
      "jbento1@gmail.com",
      "admin@admin.com",
      "rosa@colaborador.com",
      "felipe@colaborador.com",
    ].includes(user.email);

  const fetchAmostras = async () => {
    if (!hasAccess) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("amostras")
        .select(
          `
          *,
          clientes(nome)
        `
        )
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

      setAmostras((prev) =>
        prev.map((amostra) =>
          amostra.id === amostraId ? { ...amostra, data_envio: newDate || undefined } : amostra
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

      setAmostras((prev) => prev.filter((amostra) => amostra.id !== amostraId));
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

      setAmostras((prev) => prev.filter((amostra) => amostra.id !== amostraId));
      toast.success("Amostra reativada");
    } catch (error) {
      console.error("Erro ao reativar amostra:", error);
      toast.error("Erro ao reativar amostra");
    }
  };

  const handleDelete = async (amostraId: string) => {
    try {
      const { error } = await supabase.from("amostras").delete().eq("id", amostraId);

      if (error) throw error;

      setAmostras((prev) => prev.filter((amostra) => amostra.id !== amostraId));
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
          <p className="text-muted-foreground">Você não tem permissão para acessar esta seção.</p>
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
      <div className="bg-card border-border/10 flex flex-col items-center justify-between gap-4 rounded-xl border p-3 shadow-sm md:flex-row">
        <div className="relative w-full flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por referência, cliente, projeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border/10 focus:ring-primary/20 text-foreground w-full rounded-lg border py-2 pr-4 pl-10 text-sm font-medium uppercase transition-all placeholder:normal-case focus:ring-2 focus:outline-none"
          />
        </div>

        <div className="border-border/50 flex h-8 shrink-0 items-center gap-4 border-l px-3">
          <div className="flex items-center gap-2">
            <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label
              htmlFor="show-archived"
              className="text-foreground cursor-pointer text-sm font-medium whitespace-nowrap"
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
              <Button
                variant="gradient"
                className="h-9 gap-1.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                {isMobile ? "Pedir" : "Pedir Amostra"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader className="bg-card border-border/10 border-b">
                <DialogTitle>{editingAmostra ? "Editar Amostra" : "Nova Amostra"}</DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <AmostraForm amostra={editingAmostra} onSuccess={handleFormSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="border-border/10 bg-card hidden overflow-hidden border xl:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card border-border border-b dark:border-white/10">
                <TableRow className="border-border hover:bg-transparent dark:border-white/5">
                  <TableHead className="py-4 text-[10px] font-bold tracking-widest uppercase">
                    Data
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold tracking-widest uppercase">
                    Referência
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold tracking-widest uppercase">
                    Cliente
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold tracking-widest uppercase">
                    Projeto
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold tracking-widest uppercase">
                    Tipo de Produto
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-bold tracking-widest uppercase">
                    Data de Envio
                  </TableHead>
                  <TableHead className="py-4 text-right text-[10px] font-bold tracking-widest uppercase">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amostras.length === 0 ? (
                  <TableRow className="bg-card">
                    <TableCell colSpan={7} className="py-8 text-center">
                      <p className="text-muted-foreground">Nenhuma amostra encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  amostras.map((amostra) => (
                    <TableRow
                      key={amostra.id}
                      className="bg-card border-border hover:bg-muted/30 cursor-pointer border-b transition-colors dark:border-white/5"
                      onClick={() => {
                        setViewingAmostra(amostra);
                        setViewDialogOpen(true);
                      }}
                    >
                      <TableCell className="py-4 text-xs font-medium">
                        {format(new Date(amostra.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="py-4 text-xs font-bold tracking-wide uppercase">
                        {amostra.referencia}
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium uppercase">
                        {amostra.clientes?.nome || "N/A"}
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium uppercase">
                        {amostra.projeto || "N/A"}
                      </TableCell>
                      <TableCell className="py-4 text-xs font-medium uppercase">
                        {amostra.tipo_produto || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="gradient"
                              size="sm"
                              className={cn(
                                "h-8 justify-start text-left text-sm font-bold tracking-wider uppercase shadow-sm transition-all active:scale-95",
                                !amostra.data_envio && "opacity-70"
                              )}
                            >
                              <Calendar className="mr-2 h-3.5 w-3.5" />
                              {amostra.data_envio
                                ? format(new Date(amostra.data_envio), "dd/MM/yyyy")
                                : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="border-border/10 w-auto bg-popover p-0 shadow-2xl"
                            align="end"
                          >
                            <CalendarComponent
                              mode="single"
                              selected={
                                amostra.data_envio ? new Date(amostra.data_envio) : undefined
                              }
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
                                className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-cyan-500/10 hover:text-cyan-500 active:scale-95"
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
                                className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-blue-500/10 hover:text-blue-500 active:scale-95"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(amostra.id);
                                }}
                                className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-amber-500/10 hover:text-amber-500 active:scale-95"
                                title="Arquivar"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactivate(amostra.id);
                              }}
                              className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-emerald-500/10 hover:text-emerald-500 active:scale-95"
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
                                className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
                                title="Deletar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar esta amostra? Esta ação não pode
                                  ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(amostra.id)}
                                  className="border-none bg-destructive text-destructive-foreground transition-all hover:bg-destructive/90 active:scale-95"
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
      <div className="space-y-3 xl:hidden">
        {amostras.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhuma amostra encontrada</p>
            </CardContent>
          </Card>
        ) : (
          amostras.map((amostra) => (
            <Card
              key={amostra.id}
              className="border-border/10 bg-card overflow-hidden border shadow-sm"
            >
              <CardContent
                className="cursor-pointer p-4"
                onClick={() => {
                  setViewingAmostra(amostra);
                  setViewDialogOpen(true);
                }}
              >
                <div className="space-y-3">
                  {/* Header with reference and date */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight uppercase">
                        {amostra.referencia}
                      </h3>
                      <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(amostra.id);
                            }}
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
                          className="text-emerald-500 hover:bg-emerald-50/10 hover:text-emerald-600"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" title="Deletar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja deletar esta amostra? Esta ação não pode ser
                              desfeita.
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
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground text-sm">Data de Envio:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="gradient"
                          size="sm"
                          className={cn(
                            "h-7 text-sm font-bold tracking-wider uppercase",
                            !amostra.data_envio && "opacity-70"
                          )}
                        >
                          <Calendar className="mr-1 h-3 w-3" />
                          {amostra.data_envio
                            ? format(new Date(amostra.data_envio), "dd/MM/yyyy")
                            : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="border-border/10 w-auto bg-[#1c202a] p-0 shadow-2xl"
                        align="end"
                      >
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
        <DialogContent className="bg-card border-border/50 max-h-[90vh] max-w-4xl gap-0 overflow-y-auto p-0">
          <DialogHeader className="bg-card border-border/10 border-b p-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Eye className="text-primary h-6 w-6" />
              Detalhes da Amostra
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">{viewingAmostra && <AmostraView amostra={viewingAmostra} />}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
