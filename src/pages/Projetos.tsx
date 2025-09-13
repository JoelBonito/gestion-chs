import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { OptimizedRoleGuard } from '@/components/OptimizedRoleGuard';
import { ProjetoForm } from '@/components/ProjetoForm';
import { ProjetoView } from '@/components/ProjetoView';
import { ProjetoActions } from '@/components/ProjetoActions';
import { useProjetos } from '@/hooks/useProjetos';
import { Projeto } from '@/types/projeto';
import { useLocale } from '@/contexts/LocaleContext';

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
      "Carregando projetos...": { pt: "Carregando projetos...", fr: "Chargement des projets..." },
      "Nenhum projeto encontrado": { pt: "Nenhum projeto encontrado", fr: "Aucun projet trouvé" },
      "Erro ao carregar projetos": { pt: "Erro ao carregar projetos", fr: "Erreur lors du chargement des projets" }
    };
    return translations[key]?.[lang] || key;
  };

  const [showForm, setShowForm] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);
  const [viewingProjeto, setViewingProjeto] = useState<Projeto | null>(null);

  const { projetos, loading, fetchProjetos } = useProjetos();

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProjeto(null);
    setViewingProjeto(null);
    fetchProjetos();
  };

  return (
    <OptimizedRoleGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("Projetos")}</h1>
          {!isRestrictedUser && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProjeto(null)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{t("Novo Projeto")}</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProjeto ? t("Editar Projeto") : t("Novo Projeto")}</DialogTitle>
                </DialogHeader>
                <ProjetoForm projeto={editingProjeto} onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t("Carregando projetos...")}</span>
          </div>
        ) : projetos.length === 0 ? (
          <p className="text-muted-foreground">{t("Nenhum projeto encontrado")}</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {projetos.map((projeto) => (
              <Card key={projeto.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {projeto.nome}
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate">
                    {projeto.observacoes || (lang === 'fr' ? 'Pas de remarques' : 'Sem observações')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewingProjeto && (
          <Dialog open={!!viewingProjeto} onOpenChange={() => setViewingProjeto(null)}>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewingProjeto.nome}</DialogTitle>
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
    </OptimizedRoleGuard>
  );
}
