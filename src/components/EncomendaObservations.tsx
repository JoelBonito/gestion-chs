import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sendEmail, emailTemplates, emailRecipients } from '@/lib/email';

interface EncomendaObservationsProps {
  encomendaId: string;
  observacoes?: string;
  onUpdate: () => void;
  canEdit?: boolean;
}

export function EncomendaObservations({ 
  encomendaId, 
  observacoes = '', 
  onUpdate, 
  canEdit = false 
}: EncomendaObservationsProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(observacoes);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!canEdit) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('encomendas')
        .update({ observacoes: editValue || null })
        .eq('id', encomendaId);

      if (error) throw error;
      
      // Enviar notificação por email baseada no usuário
      if (editValue && editValue.trim() !== observacoes?.trim()) {
        try {
          // Buscar dados da encomenda
          const { data: encomenda } = await supabase
            .from("encomendas")
            .select("numero_encomenda, etiqueta")
            .eq("id", encomendaId)
            .single();
          
          if (encomenda) {
            const userEmail = user?.email;
            
            // Determinar destinatários baseado no usuário que fez a observação
            if (userEmail === 'msilva.lipe@gmail.com') {
              // Observação do Lipe - enviar para Felipe
              await sendEmail(
                emailRecipients.felipe,
                `📝 Observação Lipe — ${encomenda.numero_encomenda}`,
                emailTemplates.observacaoJoel(encomenda.numero_encomenda, encomenda.etiqueta || 'N/A', editValue)
              );
            } else if (userEmail === 'jbento1@gmail.com' || userEmail === 'felipe@colaborador.com') {
              // Observação do Felipe - enviar para Lipe
              await sendEmail(
                emailRecipients.lipe,
                `📝 Observação Felipe — ${encomenda.numero_encomenda}`,
                emailTemplates.observacaoFelipe(encomenda.numero_encomenda, encomenda.etiqueta || 'N/A', editValue)
              );
            }
          }
        } catch (emailError) {
          console.error("Erro ao enviar email de notificação:", emailError);
          // Não exibir erro de email para não atrapalhar o fluxo principal
        }
      }
      
      setIsEditing(false);
      onUpdate();
      toast.success('Observações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      toast.error('Erro ao salvar observações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(observacoes);
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Observações</CardTitle>
          {canEdit && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Digite suas observações aqui..."
              className="min-h-[80px] resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground min-h-[60px]">
            {observacoes || 'Nenhuma observação cadastrada.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}