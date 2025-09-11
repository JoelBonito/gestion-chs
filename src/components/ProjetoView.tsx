import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { ProjetoAttachmentManager } from '@/components/ProjetoAttachmentManager';

import { Projeto } from '@/types/projeto';

interface ProjetoViewProps {
  projeto: Projeto;
  onEdit: (projeto: Projeto) => void;
  onSuccess: () => void;
  onClose: () => void;
}

export function ProjetoView({ projeto, onEdit, onSuccess, onClose }: ProjetoViewProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  const lang = isRestrictedFR ? 'fr' : 'pt';
  const t = (key: string) => {
    const translations = {
      "Editar": { pt: "Editar", fr: "Modifier" },
      "Deletar": { pt: "Deletar", fr: "Supprimer" },
      "Confirmar Exclusão": { pt: "Confirmar Exclusão", fr: "Confirmer la suppression" },
      "Tem certeza que deseja deletar este projeto?": { pt: "Tem certeza que deseja deletar este projeto?", fr: "Êtes-vous sûr de vouloir supprimer ce projet ?" },
      "Esta ação não pode ser desfeita.": { pt: "Esta ação não pode ser desfeita.", fr: "Cette action ne peut pas être annulée." },
      "Cancelar": { pt: "Cancelar", fr: "Annuler" },
      "Deletar Projeto": { pt: "Deletar Projeto", fr: "Supprimer le projet" },
      "Criado em": { pt: "Criado em", fr: "Créé le" },
      "Atualizado em": { pt: "Atualizado em", fr: "Mis à jour le" },
      "Observações": { pt: "Observações", fr: "Observations" },
      "Nenhuma observação": { pt: "Nenhuma observação", fr: "Aucune observation" },
      "Anexos": { pt: "Anexos", fr: "Pièces jointes" },
      "Projeto deletado com sucesso": { pt: "Projeto deletado com sucesso", fr: "Projet supprimé avec succès" },
      "Erro ao deletar projeto": { pt: "Erro ao deletar projeto", fr: "Erreur lors de la suppression du projet" },
      "Deletando...": { pt: "Deletando...", fr: "Suppression..." }
    };
    return translations[key]?.[lang] || key;
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error: attachmentError } = await supabase
        .from('attachments')
        .delete()
        .eq('entity_type', 'projeto')
        .eq('entity_id', projeto.id);

      if (attachmentError) throw attachmentError;

      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', projeto.id);

      if (error) throw error;

      toast({ title: t("Projeto deletado com sucesso") });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: t("Erro ao deletar projeto"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {t("Criado em")}: {new Date(projeto.created_at).toLocaleString()}
          </div>
          {projeto.updated_at !== projeto.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {t("Atualizado em")}: {new Date(projeto.updated_at).toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(projeto)}>
            <Edit className="h-4 w-4 mr-2" />
            {t("Editar")}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? t("Deletando...") : t("Deletar")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("Confirmar Exclusão")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("Tem certeza que deseja deletar este projeto?")} "{projeto.nome}"
                  <br />
                  {t("Esta ação não pode ser desfeita.")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("Deletar Projeto")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("Observações")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projeto.observacoes ? (
              <div className="whitespace-pre-wrap text-sm">{projeto.observacoes}</div>
            ) : (
              <p className="text-muted-foreground italic">{t("Nenhuma observação")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Anexos")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjetoAttachmentManager projetoId={projeto.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
