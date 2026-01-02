import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Loader2, FolderPlus, Archive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { OptimizedRoleGuard } from "@/components/OptimizedRoleGuard";
import { ProjetoForm } from "@/components/projetos";
import { ProjetoView } from "@/components/projetos";
import { ProjetoActions } from "@/components/projetos";
import { useProjetos } from "@/hooks/useProjetos";
import { Projeto } from "@/types/projeto";
import { useLocale } from "@/contexts/LocaleContext";
import { PageContainer } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Projetos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  // Forçar francês se for ham@admin.com
  const forceFrench = user?.email?.toLowerCase() === "ham@admin.com";
  const lang: "pt" | "fr" = forceFrench ? "fr" : isRestrictedFR ? "fr" : "pt";

  // Restringir permissões para ham@admin.com
  const isRestrictedUser = user?.email?.toLowerCase() === "ham@admin.com";

  const t = (key: string) => {
    const translations = {
      Projetos: { pt: "Projetos", fr: "Projets" },
      "Novo Projeto": { pt: "Novo Projeto", fr: "Nouveau projet" },
      "Cadastrar Projeto": { pt: "Cadastrar Projeto", fr: "Créer un projet" },
      "Adicione um novo projeto para acompanhar.": {
        pt: "Adicione um novo projeto para acompanhar.",
        fr: "Ajoutez un nouveau projet à suivre.",
      },
      "Carregando projetos...": { pt: "Carregando projetos...", fr: "Chargement des projets..." },
      "Nenhum projeto encontrado": { pt: "Nenhum projeto encontrado", fr: "Aucun projet trouvé" },
      "Erro ao carregar projetos": {
        pt: "Erro ao carregar projetos",
        fr: "Erreur lors du chargement des projets",
      },
      "Mostrar Arquivados": { pt: "Mostrar Arquivados", fr: "Afficher les archivés" },
      "Editar Projeto": { pt: "Editar Projeto", fr: "Modifier le projet" },
    };
    return translations[key]?.[lang] || key;
  };

  const [showForm, setShowForm] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [viewingProjeto, setViewingProjeto] = useState<Projeto | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { projetos, loading, fetchProjetos } = useProjetos();

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProjeto(null);
    setViewingProjeto(null);
    fetchProjetos();
  };

  const filteredProjetos = projetos.filter((p) => {
    const isArchived = p.status === "arquivado";
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());

    return (showArchived ? isArchived : !isArchived) && matchesSearch;
  });

  const pageActions = !isRestrictedUser ? (
    <div className="flex items-center">
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditingProjeto(null)} variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            <span>{t("Novo Projeto")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border/50 max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProjeto ? t("Editar Projeto") : t("Novo Projeto")}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingProjeto ? t("Editar Projeto") : t("Novo Projeto")}
            </DialogDescription>
          </DialogHeader>
          <ProjetoForm projeto={editingProjeto} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  ) : null;

  return (
    <OptimizedRoleGuard>
      <PageContainer title={t("Projetos")} actions={pageActions}>
        <div className="space-y-6">
          {/* Barra de Pesquisa e Filtro */}
          <div className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border p-3 shadow-sm sm:flex-row">
            <div className="relative w-full flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={lang === "fr" ? "Rechercher des projets..." : "Pesquisar projetos..."}
                className="h-10 w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="border-border/50 flex h-8 shrink-0 items-center gap-4 border-l px-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
              </div>
              <Label
                htmlFor="show-archived"
                className="text-foreground cursor-pointer text-sm font-medium whitespace-nowrap"
              >
                {t("Mostrar Arquivados")}
              </Label>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t("Carregando projetos...")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjetos.length === 0 && showArchived && (
                <div className="text-muted-foreground col-span-full py-10 text-center">
                  {t("Nenhum projeto encontrado")}
                </div>
              )}

              {filteredProjetos.map((projeto) => (
                <Card
                  key={projeto.id}
                  className="bg-card hover:border-primary/50 group relative flex h-full min-h-[160px] cursor-pointer flex-col justify-between border border-[var(--border)] transition-colors"
                  onClick={() => setViewingProjeto(projeto)}
                >
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <ProjetoActions
                      projeto={projeto}
                      onView={setViewingProjeto}
                      onEdit={(p) => {
                        setEditingProjeto(p);
                        setShowForm(true);
                      }}
                      onRefresh={fetchProjetos}
                      isRestrictedUser={isRestrictedUser}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between gap-4 pr-8">
                      <span className="line-clamp-2 leading-tight">{projeto.nome}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {projeto.observacoes ||
                        (lang === "fr" ? "Pas de remarques" : "Sem observações")}
                    </p>
                    {projeto.status === "arquivado" && (
                      <div className="bg-muted text-muted-foreground mt-4 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                        <Archive className="mr-1 h-3 w-3" />
                        {lang === "fr" ? "Archivé" : "Arquivado"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Ghost Card for New Project */}
              {!isRestrictedUser && !showArchived && (
                <Card
                  className="border-muted-foreground/25 hover:bg-card/30 group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center border-2 border-dashed bg-transparent transition-all"
                  onClick={() => {
                    setEditingProjeto(null);
                    setShowForm(true);
                  }}
                >
                  <div className="bg-card border-border group-hover:border-primary/50 group-hover:text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-colors">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="text-foreground group-hover:text-primary text-lg font-semibold transition-colors">
                    {t("Cadastrar Projeto")}
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-[200px] text-center text-sm">
                    {t("Adicione um novo projeto para acompanhar.")}
                  </p>
                </Card>
              )}
            </div>
          )}

          {viewingProjeto && (
            <Dialog open={!!viewingProjeto} onOpenChange={() => setViewingProjeto(null)}>
              <DialogContent className="bg-card border-border/50 max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{viewingProjeto.nome}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {t("Projetos")} - {viewingProjeto.nome}
                  </DialogDescription>
                </DialogHeader>
                <ProjetoView
                  projeto={viewingProjeto}
                  onEdit={(p) => setEditingProjeto(p)}
                  onSuccess={handleSuccess}
                  onClose={() => setViewingProjeto(null)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageContainer>
    </OptimizedRoleGuard>
  );
}
