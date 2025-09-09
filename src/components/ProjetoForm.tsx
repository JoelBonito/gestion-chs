import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AttachmentManager } from '@/components/AttachmentManager';
import { useLocale } from '@/contexts/LocaleContext';

interface Projeto {
  id: string;
  nome: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface ProjetoFormProps {
  projeto?: Projeto | null;
  onSuccess: () => void;
}

export function ProjetoForm({ projeto, onSuccess }: ProjetoFormProps) {
  const [nome, setNome] = useState(projeto?.nome || '');
  const [observacoes, setObservacoes] = useState(projeto?.observacoes || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isRestrictedFR } = useLocale();

  const lang = isRestrictedFR ? 'fr' : 'pt';
  const t = (key: string) => {
    const translations = {
      "Nome do Projeto": { pt: "Nome do Projeto", fr: "Nom du projet" },
      "Digite o nome do projeto": { pt: "Digite o nome do projeto", fr: "Entrez le nom du projet" },
      "Observações": { pt: "Observações", fr: "Observations" },
      "Digite as observações do projeto": { pt: "Digite as observações do projeto", fr: "Entrez les observations du projet" },
      "Anexos": { pt: "Anexos", fr: "Pièces jointes" },
      "Cancelar": { pt: "Cancelar", fr: "Annuler" },
      "Salvar": { pt: "Salvar", fr: "Enregistrer" },
      "Atualizando...": { pt: "Atualizando...", fr: "Mise à jour..." },
      "Criando...": { pt: "Criando...", fr: "Création..." },
      "Projeto criado com sucesso": { pt: "Projeto criado com sucesso", fr: "Projet créé avec succès" },
      "Projeto atualizado com sucesso": { pt: "Projeto atualizado com sucesso", fr: "Projet mis à jour avec succès" },
      "Erro ao criar projeto": { pt: "Erro ao criar projeto", fr: "Erreur lors de la création du projet" },
      "Erro ao atualizar projeto": { pt: "Erro ao atualizar projeto", fr: "Erreur lors de la mise à jour du projet" },
      "O nome do projeto é obrigatório": { pt: "O nome do projeto é obrigatório", fr: "Le nom du projet est obligatoire" }
    };
    return translations[key]?.[lang] || key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast({
        title: t("O nome do projeto é obrigatório"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (projeto) {
        // Update existing project
        const { error } = await supabase
          .from('projetos')
          .update({
            nome: nome.trim(),
            observacoes: observacoes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projeto.id);

        if (error) throw error;

        toast({
          title: t("Projeto atualizado com sucesso"),
        });
      } else {
        // Create new project
        const { error } = await supabase
          .from('projetos')
          .insert({
            nome: nome.trim(),
            observacoes: observacoes.trim() || null,
          });

        if (error) throw error;

        toast({
          title: t("Projeto criado com sucesso"),
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: projeto ? t("Erro ao atualizar projeto") : t("Erro ao criar projeto"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome">{t("Nome do Projeto")}</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={t("Digite o nome do projeto")}
            required
          />
        </div>

        <div>
          <Label htmlFor="observacoes">{t("Observações")}</Label>
          <Textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder={t("Digite as observações do projeto")}
            rows={4}
          />
        </div>

        {projeto && (
          <div>
            <Label>{t("Anexos")}</Label>
            <AttachmentManager
              entityType="projeto"
              entityId={projeto.id}
              title={t("Anexos")}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          disabled={loading}
        >
          {t("Cancelar")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading 
            ? (projeto ? t("Atualizando...") : t("Criando..."))
            : t("Salvar")
          }
        </Button>
      </div>
    </form>
  );
}