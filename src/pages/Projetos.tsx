import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Loader2, FolderPlus, Archive } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { OptimizedRoleGuard } from '@/components/OptimizedRoleGuard';
import { ProjetoForm } from '@/components/ProjetoForm';
import { ProjetoView } from '@/components/ProjetoView';
import { ProjetoActions } from '@/components/ProjetoActions';
import { useProjetos } from '@/hooks/useProjetos';
import { Projeto } from '@/types/projeto';
import { useLocale } from '@/contexts/LocaleContext';
import { PageContainer } from '@/components/PageContainer';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Projetos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  // Forçar francês se for ham@admin.com
  const forceFrench = user?.email?.toLowerCase() === "ham@admin.com";
  const lang: "pt" | "fr" = forceFrench ? "fr" : (isRestrictedFR ? "fr" : "pt");

  // Restringir permissões para ham@admin.com
  const isRestrictedUser = user?.email?.toLowerCase() === "ham@admin.com";

  const t = (key: string) => {
    const translations = {
      "Projetos": { pt: "Projetos", fr: "Projets" },
      "Novo Projeto": { pt: "Novo Projeto", fr: "Nouveau projet" },
      "Cadastrar Projeto": { pt: "Cadastrar Projeto", fr: "Créer un projet" },
      "Adicione um novo projeto para acompanhar.": { pt: "Adicione um novo projeto para acompanhar.", fr: "Ajoutez un nouveau projet à suivre." },
      "Carregando projetos...": { pt: "Carregando projetos...", fr: "Chargement des projets..." },
      "Nenhum projeto encontrado": { pt: "Nenhum projeto encontrado", fr: "Aucun projet trouvé" },
      "Erro ao carregar projetos": { pt: "Erro ao carregar projetos", fr: "Erreur lors du chargement des projets" },
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

  const filteredProjetos = projetos.filter(p => {
    const isArchived = p.status === 'arquivado';
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (showArchived ? isArchived : !isArchived) && matchesSearch;
  });

  const pageActions = !isRestrictedUser ? (
    <div className="flex items-center">
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditingProjeto(null)} variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            <span>{t("Novo Projeto")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
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
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-3 rounded-xl border border-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang === 'fr' ? "Rechercher des projets..." : "Pesquisar projetos..."}
                className="pl-10 h-10 w-full"
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
              </div>
              <Label
                htmlFor="show-archived"
                className="cursor-pointer text-sm font-medium whitespace-nowrap text-foreground dark:text-white"
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjetos.length === 0 && showArchived && (
                <div className="col-span-full py-10 text-center text-muted-foreground">
                  {t("Nenhum projeto encontrado")}
                </div>
              )}

              {filteredProjetos.map((projeto) => (
                <Card
                  key={projeto.id}
                  className="relative border border-[var(--border)] bg-card cursor-pointer hover:border-primary/50 transition-colors group flex flex-col justify-between h-full min-h-[160px]"
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
                    <CardTitle className="pr-8 flex justify-between items-start gap-4">
                      <span className="leading-tight line-clamp-2">{projeto.nome}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {projeto.observacoes || (lang === 'fr' ? 'Pas de remarques' : 'Sem observações')}
                    </p>
                    {projeto.status === 'arquivado' && (
                      <div className="mt-4 inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                        <Archive className="w-3 h-3 mr-1" />
                        {lang === 'fr' ? 'Archivé' : 'Arquivado'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Ghost Card for New Project */}
              {!isRestrictedUser && !showArchived && (
                <Card
                  className="relative border-2 border-dashed border-muted-foreground/25 bg-transparent hover:bg-card/30 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] group"
                  onClick={() => {
                    setEditingProjeto(null);
                    setShowForm(true);
                  }}
                >
                  <div className="h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center mb-4 group-hover:border-primary/50 group-hover:text-primary transition-colors shadow-sm">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t("Cadastrar Projeto")}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-[200px] mt-1">
                    {t("Adicione um novo projeto para acompanhar.")}
                  </p>
                </Card>
              )}
            </div>
          )}

          {viewingProjeto && (
            <Dialog open={!!viewingProjeto} onOpenChange={() => setViewingProjeto(null)}>
              <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
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
