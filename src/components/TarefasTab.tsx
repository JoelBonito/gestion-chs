import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Encomenda {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  status: string;
  observacoes_joel?: string | null;
  observacoes_felipe?: string | null;
}

interface EditingState {
  id: string;
  field: 'observacoes_joel' | 'observacoes_felipe';
  value: string;
}

export function TarefasTab() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fornecedores permitidos para o Felipe (UUIDs)
  const ALLOWED_SUPPLIERS_FOR_FELIPE = [
    "f0920a27-752c-4483-ba02-e7f32beceef6",
    "b8f995d2-47dc-4c8f-9779-ce21431f5244",
  ];

  // Determinar permissões baseado no email
  const isJoel = userEmail === 'jbento1@gmail.com' || userEmail === 'admin@admin.com';
  const isFelipe = userEmail === 'felipe@colaborador.com';
  const isHam = userEmail === 'ham@admin.com';
  const isReadOnly = !isJoel && !isFelipe;

  useEffect(() => {
    const initializeData = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? null;
      setUserEmail(email);
      
      // Depois buscar as encomendas (já com o email correto)
      await fetchEncomendas(email);
    };
    
    initializeData();
  }, []);

  const fetchEncomendas = async (emailOverride?: string) => {
    try {
      setLoading(true);

      const emailToUse = emailOverride ?? userEmail ?? null;
      const isFelipeCheck = emailToUse === 'felipe@colaborador.com';

      let query = supabase
        .from('encomendas')
        .select('id, numero_encomenda, etiqueta, status, observacoes_joel, observacoes_felipe, fornecedor_id')
        .neq('status', 'ENTREGUE');

      // Filtrar por fornecedores permitidos para Felipe
      if (isFelipeCheck) {
        query = query.in('fornecedor_id', ALLOWED_SUPPLIERS_FOR_FELIPE);
      }

      const { data, error } = await query.order('numero_encomenda', { ascending: true });

      if (error) throw error;
      setEncomendas(data || []);
    } catch (error) {
      console.error('Erro ao carregar encomendas:', error);
      toast.error('Erro ao carregar encomendas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, field: 'observacoes_joel' | 'observacoes_felipe') => {
    const encomenda = encomendas.find(e => e.id === id);
    if (!encomenda) return;

    setEditing({
      id,
      field,
      value: encomenda[field] || ''
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      const { error } = await supabase
        .from('encomendas')
        .update({ [editing.field]: editing.value })
        .eq('id', editing.id);

      if (error) throw error;

      // Atualizar estado local
      setEncomendas(prev => prev.map(enc => 
        enc.id === editing.id 
          ? { ...enc, [editing.field]: editing.value }
          : enc
      ));

      setEditing(null);
      toast.success('Observação salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar observação');
    }
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const filteredEncomendas = encomendas.filter(enc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      enc.numero_encomenda.toLowerCase().includes(searchLower) ||
      (enc.etiqueta || '').toLowerCase().includes(searchLower)
    );
  });

  // Se for Ham, não mostrar a aba
  if (isHam) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por número ou etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de encomendas */}
      <div className="space-y-4">
        {filteredEncomendas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'Nenhuma encomenda encontrada para sua busca.' : 'Nenhuma encomenda encontrada.'}
            </CardContent>
          </Card>
        ) : (
          filteredEncomendas.map((encomenda) => (
            <Card key={encomenda.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Cabeçalho da encomenda */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-primary-dark">#{encomenda.numero_encomenda}</h3>
                      {encomenda.etiqueta && (
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit">
                          {encomenda.etiqueta}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seções de observações */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Observações Joel */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Observações Joel
                        </h4>
                        {isJoel && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(encomenda.id, 'observacoes_joel')}
                            disabled={editing?.id === encomenda.id}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {editing?.id === encomenda.id && editing.field === 'observacoes_joel' ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editing.value}
                            onChange={(e) => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                            placeholder="Digite as observações de Joel..."
                            className="min-h-[80px] resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md min-h-[80px] text-sm whitespace-pre-wrap">
                          {encomenda.observacoes_joel || (
                            <span className="text-muted-foreground italic">
                              Sem observações
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Observações Felipe */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          Observações Felipe
                        </h4>
                        {isFelipe && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(encomenda.id, 'observacoes_felipe')}
                            disabled={editing?.id === encomenda.id}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {editing?.id === encomenda.id && editing.field === 'observacoes_felipe' ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editing.value}
                            onChange={(e) => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                            placeholder="Digite as observações de Felipe..."
                            className="min-h-[80px] resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md min-h-[80px] text-sm whitespace-pre-wrap">
                          {encomenda.observacoes_felipe || (
                            <span className="text-muted-foreground italic">
                              Sem observações
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}