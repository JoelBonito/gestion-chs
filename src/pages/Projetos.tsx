import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Folder, FileText, Calendar, Edit, Trash2, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/contexts/LocaleContext';
import { ProjetoForm } from '@/components/ProjetoForm';
import { ProjetoView } from '@/components/ProjetoView';
import { OptimizedRoleGuard } from '@/components/OptimizedRoleGuard';

interface Projeto {
  id: string;
  nome: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function Projetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [showView, setShowView] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isRestrictedFR } = useLocale();

  const lang = isRestrictedFR ? 'fr' : 'pt';
  const t = (key: string) => {
    const translations = {
      "Projetos": { pt: "Projetos", fr: "Projets" },
      "Novo Projeto": { pt: "Novo Projeto", fr: "Nouveau projet" },
      "Gerir projetos do sistema": { pt: "Gerir projetos do sistema", fr: "Gérer les projets du système" },
      "Nenhum projeto encontrado": { pt: "Nenhum projeto encontrado", fr: "Aucun projet trouvé" },
      "Adicione o primeiro projeto": { pt: "Adicione o primeiro projeto", fr: "Ajoutez le premier projet" },
      "Erro ao carregar projetos": { pt: "Erro ao carregar projetos", fr: "Erreur lors du chargement des projets" },
      "Criado em": { pt: "Criado em", fr: "Créé le" }
    };
    return translations[key]?.[lang] || key;
  };

  const fetchProjetos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjetos(data || []);
    } catch (error: any) {
      toast({
        title: t("Erro ao carregar projetos"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjetos();
    }
  }, [user]);

  const handleSuccess = () => {
    fetchProjetos();
    setShowForm(false);
    setSelectedProjeto(null);
  };

  const handleEdit = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setShowForm(true);
  };

  const handleDelete = async (projeto: Projeto) => {
    try {
      // Delete attachments first
      const { error: attachmentError } = await supabase
        .from('attachments')
        .delete()
        .eq('entity_type', 'projeto')
        .eq('entity_id', projeto.id);

      if (attachmentError) throw attachmentError;

      // Delete project
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', projeto.id);

      if (error) throw error;

      toast({
        title: "Projeto deletado com sucesso",
      });

      fetchProjetos();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar projeto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleView = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setShowView(true);
  };

  return (
    <OptimizedRoleGuard 
      allowedEmails={['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com']}
    >
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  {t("Projetos")}
                </CardTitle>
                <CardDescription>
                  {t("Gerir projetos do sistema")}
                </CardDescription>
              </div>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedProjeto(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("Novo Projeto")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedProjeto ? 'Editar Projeto' : t("Novo Projeto")}
                    </DialogTitle>
                  </DialogHeader>
                  <ProjetoForm 
                    projeto={selectedProjeto} 
                    onSuccess={handleSuccess} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : projetos.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {t("Nenhum projeto encontrado")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("Adicione o primeiro projeto")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projetos.map((projeto) => (
                  <Card 
                    key={projeto.id} 
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {projeto.nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {projeto.observacoes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {projeto.observacoes}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {t("Criado em")}: {new Date(projeto.created_at).toLocaleDateString()}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-1 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(projeto);
                            }}
                            className="flex-1"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(projeto);
                            }}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar o projeto "{projeto.nome}"?
                                  <br />
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(projeto)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar Projeto
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showView} onOpenChange={setShowView}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedProjeto?.nome}</DialogTitle>
            </DialogHeader>
            {selectedProjeto && (
              <ProjetoView 
                projeto={selectedProjeto}
                onEdit={handleEdit}
                onSuccess={handleSuccess}
                onClose={() => setShowView(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OptimizedRoleGuard>
  );
}