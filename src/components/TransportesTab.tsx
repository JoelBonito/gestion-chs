import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AttachmentManager } from "@/components/AttachmentManager";
import { Eye, Edit, Archive, Plus, RotateCcw, Truck, Search } from "lucide-react";
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

import { GlassCard } from "@/components/GlassCard";
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
  const isHam = isRestrictedFR || user?.email === 'ham@admin.com';
  const lang = isHam ? 'fr' : 'pt';

  const t = (k: string) => {
    const d: Record<string, { pt: string, fr: string }> = {
      "Pesquisar transportes...": { pt: "Pesquisar transportes...", fr: "Rechercher des transports..." },
      "Mostrar Arquivados": { pt: "Mostrar Arquivados", fr: "Afficher Archivés" },
      "Mostrar Ativos": { pt: "Mostrar Ativos", fr: "Afficher Actifs" },
      "Novo Transporte": { pt: "Novo Transporte", fr: "Nouveau Transport" },
      "Novo": { pt: "Novo", fr: "Nouveau" },
      "Nenhum transporte encontrado.": { pt: "Nenhum transporte encontrado.", fr: "Aucun transport trouvé." },
      "Tente ajustar sua busca.": { pt: "Tente ajustar sua busca.", fr: "Essayez d'ajuster votre recherche." },
      "Clique em 'Novo Transporte' para criar o primeiro registro.": { pt: "Clique em 'Novo Transporte' para criar o primeiro registro.", fr: "Cliquez sur 'Nouveau Transport' pour créer le premier enregistrement." },
      "Tracking Number": { pt: "Tracking Number", fr: "Numéro de suivi" },
      "ARQUIVADO": { pt: "ARQUIVADO", fr: "ARCHIVÉ" },
      "Referência / Info": { pt: "Referência / Info", fr: "Référence / Info" },
      "Sem referência definida": { pt: "Sem referência definida", fr: "Aucune référence définie" },
      "Rastrear": { pt: "Rastrear", fr: "Suivre" },
      "Visualizar Detalhes": { pt: "Visualizar Detalhes", fr: "Voir les détails" },
      "Editar": { pt: "Editar", fr: "Modifier" },
      "Arquivar": { pt: "Arquivar", fr: "Archiver" },
      "Reativar": { pt: "Reativar", fr: "Réactiver" },
      "Editar Transporte": { pt: "Editar Transporte", fr: "Modifier le Transport" },
      "Digite o número de rastreamento": { pt: "Digite o número de rastreamento", fr: "Saisissez le numéro de suivi" },
      "Referência": { pt: "Referência", fr: "Référence" },
      "Referência ou observação": { pt: "Referência ou observação", fr: "Référence ou observation" },
      "Após salvar, você poderá anexar arquivos PDF/JPEG.": { pt: "Após salvar, você poderá anexar arquivos PDF/JPEG.", fr: "Après avoir enregistré, vous pourrez joindre des fichiers PDF/JPEG." },
      "Salvar": { pt: "Salvar", fr: "Enregistrer" },
      "Atualizar": { pt: "Atualizar", fr: "Mettre à jour" },
      "Salvando...": { pt: "Salvando...", fr: "Enregistrement..." },
      "Atualizando...": { pt: "Atualizando...", fr: "Mise à jour..." },
      "Cancelar": { pt: "Cancelar", fr: "Annuler" },
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

  const filteredTransportes = transportes.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      t.tracking_number.toLowerCase().includes(q) ||
      (t.referencia || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Pesquisar transportes...")}
            className="pl-10 h-10 w-full bg-input border-border/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              {showArchived ? t("Mostrar Arquivados") : t("Mostrar Ativos")}
            </Label>
          </div>

          {!isHam && (
            <Button
              onClick={openNewDialog}
              variant="gradient"
              className="h-9 active:scale-95 transition-all shadow-md hover:shadow-primary/20"
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
        <GlassCard className="p-12 text-center bg-card border-dashed">
          <p className="text-muted-foreground">{t("Nenhum transporte encontrado.")}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {searchTerm ? t("Tente ajustar sua busca.") : (!isHam && t("Clique em 'Novo Transporte' para criar o primeiro registro."))}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTransportes.map((transporte) => (
            <GlassCard
              key={transporte.id}
              className={`relative overflow-hidden bg-card transition-all duration-300 hover:shadow-lg ${transporte.archived ? 'opacity-60' : ''}`}
              hoverEffect
            >
              <div className="p-5 flex flex-col h-full gap-4 cursor-pointer" onClick={() => handleView(transporte)}>
                <div className="space-y-4">
                  {/* Cabeçalho do Card: Tracking */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">{t("Tracking Number")}</span>
                      <div className="font-mono font-bold text-lg text-primary truncate tracking-tight">
                        #{transporte.tracking_number}
                      </div>
                    </div>
                    {transporte.archived && (
                      <Badge variant="destructive" className="shrink-0 text-[10px] uppercase tracking-tighter">
                        {t("ARQUIVADO")}
                      </Badge>
                    )}
                  </div>
                  {/* Corpo do Card: Referência */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">{t("Referência / Info")}</span>
                    <div className={cn("text-sm font-medium leading-normal text-foreground/90", !transporte.referencia && "text-muted-foreground italic")}>
                      {transporte.referencia || t("Sem referência definida")}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Ações */}
                <div className="pt-4 border-t border-border/10 flex items-center justify-between gap-3 mt-auto">
                  {!transporte.archived ? (
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={(e) => { e.stopPropagation(); handleTrackingClick(transporte.tracking_number); }}
                      className="h-8 px-4 text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all w-full sm:w-auto"
                    >
                      <Truck className="w-3.5 h-3.5 mr-2" />
                      {t("Rastrear")}
                    </Button>
                  ) : <div />}

                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleView(transporte); }}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-90 transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t("Visualizar Detalhes")}</p></TooltipContent>
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
                                onClick={(e) => { e.stopPropagation(); handleEdit(transporte); }}
                                className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 active:scale-90 transition-all"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t("Editar")}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleArchive(transporte); }}
                                className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 active:scale-90 transition-all"
                                disabled={isLoading}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t("Arquivar")}</p></TooltipContent>
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
                              onClick={(e) => { e.stopPropagation(); handleReactivate(transporte); }}
                              className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-90 transition-all"
                              disabled={isLoading}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>{t("Reativar")}</p></TooltipContent>
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
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-border/50">
          <DialogHeader className="p-6 bg-card border-b border-border/10">
            <DialogTitle className="text-foreground">
              {editingTransporte ? t("Editar Transporte") : t("Novo Transporte")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Tracking Number")} *</Label>
              <Input
                placeholder={t("Digite o número de rastreamento")}
                value={novo.tracking_number}
                onChange={(e) => setNovo((n) => ({ ...n, tracking_number: e.target.value }))}
                pattern="[A-Za-z0-9]*"
                className="bg-input border-border/40 focus:border-primary/50 transition-all font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{t("Referência")}</Label>
              <Input
                placeholder={t("Referência ou observação")}
                value={novo.referencia}
                onChange={(e) => setNovo((n) => ({ ...n, referencia: e.target.value }))}
                className="bg-input border-border/40 focus:border-primary/50 transition-all"
              />
            </div>
            {!editingTransporte && (
              <p className="text-xs text-muted-foreground italic bg-primary/5 p-3 rounded-lg border border-primary/10">
                {t("Após salvar, você poderá anexar arquivos PDF/JPEG.")}
              </p>
            )}
            <div className="flex gap-3 pt-6 border-t border-border/10">
              <Button onClick={handleSalvar} variant="gradient" className="flex-1 active:scale-95 transition-all" disabled={isLoading}>
                {isLoading ? (editingTransporte ? t("Atualizando...") : t("Salvando...")) : (editingTransporte ? t("Atualizar") : t("Salvar"))}
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
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0 bg-card border-border/50 shadow-2xl">
          <DialogHeader className="p-6 bg-card border-b border-border/10">
            <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
              <Truck className="h-6 w-6 text-primary" />
              {t("Detalhes do Transporte")}
            </DialogTitle>
          </DialogHeader>
          {viewingTransporte && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                <div className="sm:col-span-5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1.5 opacity-70">
                    {t("Tracking Number")}
                  </label>
                  <div className="text-xl font-mono font-bold text-primary break-all leading-tight">
                    #{viewingTransporte.tracking_number}
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1.5 opacity-70">
                    {t("Referência")}
                  </label>
                  <div className="text-sm font-medium leading-relaxed break-words text-foreground">
                    {viewingTransporte.referencia || "—"}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1.5 opacity-70">
                    {t("Data de Criação")}
                  </label>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(viewingTransporte.created_at).toLocaleDateString(isHam ? "fr-FR" : "pt-BR")}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/10 pt-6">
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