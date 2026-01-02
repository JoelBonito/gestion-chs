import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AttachmentManager } from "@/components/shared";
import { Eye, Edit, Archive, Plus, RotateCcw, Truck, Search } from "lucide-react";
import { toast } from "sonner";
import { archiveTransporte, reactivateTransporte } from "@/lib/soft-delete-actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { GlassCard } from "@/components/shared";
import { cn } from "@/lib/utils";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { isRestrictedFR } = useLocale();
  const { user } = useAuth();
  const isHam = isRestrictedFR || user?.email === "ham@admin.com";
  const lang = isHam ? "fr" : "pt";

  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      "Pesquisar transportes...": {
        pt: "Pesquisar transportes...",
        fr: "Rechercher des transports...",
      },
      "Mostrar Arquivados": { pt: "Mostrar Arquivados", fr: "Afficher Archivés" },
      "Mostrar Ativos": { pt: "Mostrar Ativos", fr: "Afficher Actifs" },
      "Novo Transporte": { pt: "Novo Transporte", fr: "Nouveau Transport" },
      Novo: { pt: "Novo", fr: "Nouveau" },
      "Nenhum transporte encontrado.": {
        pt: "Nenhum transporte encontrado.",
        fr: "Aucun transport trouvé.",
      },
      "Tente ajustar sua busca.": {
        pt: "Tente ajustar sua busca.",
        fr: "Essayez d'ajuster votre recherche.",
      },
      "Clique em 'Novo Transporte' para criar o primeiro registro.": {
        pt: "Clique em 'Novo Transporte' para criar o primeiro registro.",
        fr: "Cliquez sur 'Nouveau Transport' pour créer le premier enregistrement.",
      },
      "Tracking Number": { pt: "Tracking Number", fr: "Numéro de suivi" },
      ARQUIVADO: { pt: "ARQUIVADO", fr: "ARCHIVÉ" },
      "Referência / Info": { pt: "Referência / Info", fr: "Référence / Info" },
      "Sem referência definida": { pt: "Sem referência definida", fr: "Aucune référence définie" },
      Rastrear: { pt: "Rastrear", fr: "Suivre" },
      "Visualizar Detalhes": { pt: "Visualizar Detalhes", fr: "Voir les détails" },
      Editar: { pt: "Editar", fr: "Modifier" },
      Arquivar: { pt: "Arquivar", fr: "Archiver" },
      Reativar: { pt: "Reativar", fr: "Réactiver" },
      "Editar Transporte": { pt: "Editar Transporte", fr: "Modifier le Transport" },
      "Digite o número de rastreamento": {
        pt: "Digite o número de rastreamento",
        fr: "Saisissez le numéro de suivi",
      },
      Referência: { pt: "Referência", fr: "Référence" },
      "Referência ou observação": {
        pt: "Referência ou observação",
        fr: "Référence ou observation",
      },
      "Após salvar, você poderá anexar arquivos PDF/JPEG.": {
        pt: "Após salvar, você poderá anexar arquivos PDF/JPEG.",
        fr: "Après avoir enregistré, vous pourrez joindre des fichiers PDF/JPEG.",
      },
      Salvar: { pt: "Salvar", fr: "Enregistrer" },
      Atualizar: { pt: "Atualizar", fr: "Mettre à jour" },
      "Salvando...": { pt: "Salvando...", fr: "Enregistrement..." },
      "Atualizando...": { pt: "Atualizando...", fr: "Mise à jour..." },
      Cancelar: { pt: "Cancelar", fr: "Annuler" },
      "Detalhes do Transporte": { pt: "Detalhes do Transporte", fr: "Détails du Transport" },
      "Data de Criação": { pt: "Data de Criação", fr: "Date de Création" },
      "Anexos do Transporte": { pt: "Anexos do Transporte", fr: "Pièces jointes du Transport" },
    };
    return d[k]?.[lang] || k;
  };

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
      const { error: insertError } = await supabase.from("transportes").insert([data]);
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
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filteredTransportes = transportes.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      t.tracking_number.toLowerCase().includes(q) || (t.referencia || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border-border flex flex-col items-center justify-between gap-4 rounded-xl border p-3 shadow-sm md:flex-row">
        <div className="relative w-full flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("Pesquisar transportes...")}
            className="bg-input border-border/40 h-10 w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="border-border/50 flex h-8 shrink-0 items-center gap-4 border-l px-3">
          <div className="flex items-center gap-2">
            <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label
              htmlFor="show-archived"
              className="text-foreground cursor-pointer text-sm font-medium whitespace-nowrap"
            >
              {showArchived ? t("Mostrar Arquivados") : t("Mostrar Ativos")}
            </Label>
          </div>

          {!isHam && (
            <Button
              onClick={openNewDialog}
              variant="gradient"
              className="hover:shadow-primary/20 h-9 shadow-md transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("Novo Transporte")}</span>
              <span className="sm:hidden">{t("Novo")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Lista de transportes */}
      {filteredTransportes.length === 0 ? (
        <GlassCard className="bg-card border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("Nenhum transporte encontrado.")}</p>
          <p className="text-muted-foreground/60 mt-1 text-sm">
            {searchTerm
              ? t("Tente ajustar sua busca.")
              : !isHam && t("Clique em 'Novo Transporte' para criar o primeiro registro.")}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredTransportes.map((transporte) => (
            <GlassCard
              key={transporte.id}
              className={`bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg ${transporte.archived ? "opacity-60" : ""}`}
              hoverEffect
            >
              <div
                className="flex h-full cursor-pointer flex-col gap-4 p-5"
                onClick={() => handleView(transporte)}
              >
                <div className="space-y-4">
                  {/* Cabeçalho do Card: Tracking */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-muted-foreground mb-1 block text-[10px] font-bold tracking-widest uppercase">
                        {t("Tracking Number")}
                      </span>
                      <div className="text-primary truncate font-mono text-lg font-bold tracking-tight">
                        #{transporte.tracking_number}
                      </div>
                    </div>
                    {transporte.archived && (
                      <Badge
                        variant="destructive"
                        className="shrink-0 text-[10px] tracking-tighter uppercase"
                      >
                        {t("ARQUIVADO")}
                      </Badge>
                    )}
                  </div>
                  {/* Corpo do Card: Referência */}
                  <div>
                    <span className="text-muted-foreground mb-1 block text-[10px] font-bold tracking-widest uppercase">
                      {t("Referência / Info")}
                    </span>
                    <div
                      className={cn(
                        "text-foreground/90 text-sm leading-normal font-medium",
                        !transporte.referencia && "text-muted-foreground italic"
                      )}
                    >
                      {transporte.referencia || t("Sem referência definida")}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Ações */}
                <div className="border-border/10 mt-auto flex items-center justify-between gap-3 border-t pt-4">
                  {!transporte.archived ? (
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackingClick(transporte.tracking_number);
                      }}
                      className="h-8 w-full px-4 text-xs font-bold tracking-wider uppercase shadow-sm transition-all active:scale-95 sm:w-auto"
                    >
                      <Truck className="mr-2 h-3.5 w-3.5" />
                      {t("Rastrear")}
                    </Button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(transporte);
                            }}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 transition-all active:scale-90"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("Visualizar Detalhes")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {!transporte.archived && !isHam && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(transporte);
                                }}
                                className="text-muted-foreground h-8 w-8 transition-all hover:bg-blue-500/10 hover:text-blue-500 active:scale-90"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("Editar")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(transporte);
                                }}
                                className="text-muted-foreground h-8 w-8 transition-all hover:bg-amber-500/10 hover:text-amber-500 active:scale-90"
                                disabled={isLoading}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("Arquivar")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}

                    {transporte.archived && !isHam && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactivate(transporte);
                              }}
                              className="text-muted-foreground h-8 w-8 transition-all hover:bg-emerald-500/10 hover:text-emerald-500 active:scale-90"
                              disabled={isLoading}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("Reativar")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar transporte */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border/50 max-h-[90vh] w-[95vw] max-w-[500px] gap-0 overflow-y-auto p-0">
          <DialogHeader className="bg-card border-border/10 border-b p-6">
            <DialogTitle className="text-foreground">
              {editingTransporte ? t("Editar Transporte") : t("Novo Transporte")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                {t("Tracking Number")} *
              </Label>
              <Input
                placeholder={t("Digite o número de rastreamento")}
                value={novo.tracking_number}
                onChange={(e) => setNovo((n) => ({ ...n, tracking_number: e.target.value }))}
                pattern="[A-Za-z0-9]*"
                className="bg-input border-border/40 focus:border-primary/50 font-mono transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                {t("Referência")}
              </Label>
              <Input
                placeholder={t("Referência ou observação")}
                value={novo.referencia}
                onChange={(e) => setNovo((n) => ({ ...n, referencia: e.target.value }))}
                className="bg-input border-border/40 focus:border-primary/50 transition-all"
              />
            </div>
            {!editingTransporte && (
              <p className="text-muted-foreground bg-primary/5 border-primary/10 rounded-lg border p-3 text-xs italic">
                {t("Após salvar, você poderá anexar arquivos PDF/JPEG.")}
              </p>
            )}
            <div className="border-border/10 flex gap-3 border-t pt-6">
              <Button
                onClick={handleSalvar}
                variant="gradient"
                className="flex-1 transition-all active:scale-95"
                disabled={isLoading}
              >
                {isLoading
                  ? editingTransporte
                    ? t("Atualizando...")
                    : t("Salvando...")
                  : editingTransporte
                    ? t("Atualizar")
                    : t("Salvar")}
              </Button>
              <Button
                variant="cancel"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
                disabled={isLoading}
              >
                {t("Cancelar")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar transporte */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-card border-border/50 max-h-[90vh] w-[95vw] max-w-3xl gap-0 overflow-x-hidden overflow-y-auto p-0 shadow-2xl">
          <DialogHeader className="bg-card border-border/10 border-b p-6">
            <DialogTitle className="text-foreground flex items-center gap-2 text-xl">
              <Truck className="text-primary h-6 w-6" />
              {t("Detalhes do Transporte")}
            </DialogTitle>
          </DialogHeader>
          {viewingTransporte && (
            <div className="space-y-8 p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="text-muted-foreground mb-1.5 block text-[10px] font-bold tracking-widest uppercase opacity-70">
                    {t("Tracking Number")}
                  </label>
                  <div className="text-primary font-mono text-xl leading-tight font-bold break-all">
                    #{viewingTransporte.tracking_number}
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label className="text-muted-foreground mb-1.5 block text-[10px] font-bold tracking-widest uppercase opacity-70">
                    {t("Referência")}
                  </label>
                  <div className="text-foreground text-sm leading-relaxed font-medium break-words">
                    {viewingTransporte.referencia || "—"}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-muted-foreground mb-1.5 block text-[10px] font-bold tracking-widest uppercase opacity-70">
                    {t("Data de Criação")}
                  </label>
                  <div className="text-foreground text-sm font-medium">
                    {new Date(viewingTransporte.created_at).toLocaleDateString(
                      isHam ? "fr-FR" : "pt-BR"
                    )}
                  </div>
                </div>
              </div>

              <div className="border-border/10 border-t pt-6">
                <AttachmentManager
                  entityType="transporte"
                  entityId={viewingTransporte.id}
                  title={t("Anexos do Transporte")}
                  useTertiaryLayer={true}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
