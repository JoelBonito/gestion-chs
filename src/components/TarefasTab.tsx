import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Save, X, Package, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/GlassCard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "NOVO PEDIDO": return "bg-blue-600 border-transparent";
    case "MATÉRIA PRIMA": return "bg-orange-500 border-transparent";
    case "PRODUÇÃO": return "bg-sky-500 border-transparent";
    case "EMBALAGENS": return "bg-emerald-500 border-transparent";
    case "TRANSPORTE": return "bg-purple-600 border-transparent";
    case "ENTREGUE": return "bg-green-600 border-transparent";
    default: return "bg-slate-500 border-transparent";
  }
};

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
          <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassCard key={i} className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Skeleton className="h-7 w-32 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas - Busca */}
      <GlassCard className="p-4 bg-card">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por número ou etiqueta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-input border-border/40 focus:ring-primary/20 text-foreground"
          />
        </div>
      </GlassCard>

      {/* Lista de Tarefas (Encomendas Ativas) */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEncomendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-dashed border-border/50">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchTerm ? 'Nenhuma encomenda encontrada.' : 'Sem tarefas pendentes no momento.'}
            </h3>
          </div>
        ) : (
          filteredEncomendas.map((encomenda) => (
            <GlassCard key={encomenda.id} className="p-0 overflow-hidden bg-card" hoverEffect>
              <div className="p-5 space-y-6">
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between gap-3 border-b border-border/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold font-mono text-primary">
                      #{encomenda.numero_encomenda}
                    </span>
                    {encomenda.etiqueta && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                        {encomenda.etiqueta}
                      </Badge>
                    )}
                  </div>
                  <Badge className={cn("text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 shadow-sm", getStatusColor(encomenda.status))}>
                    {encomenda.status}
                  </Badge>
                </div>

                {/* Grid de Observações (Tarefas) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Seção Joel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between min-h-[32px]">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-70">
                        Instruções (Joel)
                      </label>
                      {isJoel && editing?.id !== encomenda.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(encomenda.id, 'observacoes_joel')}
                          className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:scale-110 active:scale-90 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {editing?.id === encomenda.id && editing.field === 'observacoes_joel' ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editing.value}
                          onChange={(e) => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                          placeholder="Digite as instruções..."
                          className="min-h-[120px] bg-input border-border/50 focus:border-primary/50 text-sm leading-relaxed text-foreground"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={handleSave}
                            className="h-9 px-4 active:scale-95 transition-all"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="cancel"
                            onClick={handleCancel}
                            className="h-9 px-4"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-accent border border-border/10 min-h-[120px] text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {encomenda.observacoes_joel || (
                          <span className="text-muted-foreground/40 italic">Sem instruções registradas pelo Joel.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seção Felipe */}
                  <div className="space-y-3 lg:border-l border-border/10 lg:pl-8">
                    <div className="flex items-center justify-between min-h-[32px]">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-70">
                        Feedback de Produção (Felipe)
                      </label>
                      {isFelipe && editing?.id !== encomenda.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(encomenda.id, 'observacoes_felipe')}
                          className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:scale-110 active:scale-90 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {editing?.id === encomenda.id && editing.field === 'observacoes_felipe' ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editing.value}
                          onChange={(e) => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                          placeholder="Digite o feedback..."
                          className="min-h-[120px] bg-input border-border/50 focus:border-primary/50 text-sm leading-relaxed text-foreground"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={handleSave}
                            className="h-9 px-4 active:scale-95 transition-all"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="cancel"
                            onClick={handleCancel}
                            className="h-9 px-4"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-accent border border-border/10 min-h-[120px] text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {encomenda.observacoes_felipe || (
                          <span className="text-muted-foreground/40 italic">Sem feedback registrado pelo Felipe.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}