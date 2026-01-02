import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Save, X, Package, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  field: "observacoes_joel" | "observacoes_felipe";
  value: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "NOVO PEDIDO":
      return "bg-blue-600 border-transparent";
    case "MATÉRIA PRIMA":
      return "bg-orange-500 border-transparent";
    case "PRODUÇÃO":
      return "bg-sky-500 border-transparent";
    case "EMBALAGENS":
      return "bg-emerald-500 border-transparent";
    case "TRANSPORTE":
      return "bg-purple-600 border-transparent";
    case "ENTREGUE":
      return "bg-green-600 border-transparent";
    default:
      return "bg-muted border-transparent";
  }
};

export function TarefasTab() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fornecedores permitidos para o Felipe (UUIDs)
  const ALLOWED_SUPPLIERS_FOR_FELIPE = [
    "f0920a27-752c-4483-ba02-e7f32beceef6",
    "b8f995d2-47dc-4c8f-9779-ce21431f5244",
  ];

  // Determinar permissões baseado no email
  const isJoel = userEmail === "jbento1@gmail.com" || userEmail === "admin@admin.com";
  const isFelipe = userEmail === "felipe@colaborador.com";
  const isHam = userEmail === "ham@admin.com";
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
      const isFelipeCheck = emailToUse === "felipe@colaborador.com";

      let query = supabase
        .from("encomendas")
        .select(
          "id, numero_encomenda, etiqueta, status, observacoes_joel, observacoes_felipe, fornecedor_id"
        )
        .neq("status", "ENTREGUE");

      // Filtrar por fornecedores permitidos para Felipe
      if (isFelipeCheck) {
        query = query.in("fornecedor_id", ALLOWED_SUPPLIERS_FOR_FELIPE);
      }

      const { data, error } = await query.order("numero_encomenda", { ascending: true });

      if (error) throw error;
      setEncomendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, field: "observacoes_joel" | "observacoes_felipe") => {
    const encomenda = encomendas.find((e) => e.id === id);
    if (!encomenda) return;

    setEditing({
      id,
      field,
      value: encomenda[field] || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ [editing.field]: editing.value })
        .eq("id", editing.id);

      if (error) throw error;

      // Atualizar estado local
      setEncomendas((prev) =>
        prev.map((enc) =>
          enc.id === editing.id ? { ...enc, [editing.field]: editing.value } : enc
        )
      );

      setEditing(null);
      toast.success("Observação salva com sucesso");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar observação");
    }
  };

  const handleCancel = () => {
    setEditing(null);
  };

  const filteredEncomendas = encomendas.filter((enc) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      enc.numero_encomenda.toLowerCase().includes(searchLower) ||
      (enc.etiqueta || "").toLowerCase().includes(searchLower)
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
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-32 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
      <GlassCard className="bg-card p-4">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por número ou etiqueta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border/40 focus:ring-primary/20 text-foreground h-10 pl-10"
          />
        </div>
      </GlassCard>

      {/* Lista de Tarefas (Encomendas Ativas) */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEncomendas.length === 0 ? (
          <div className="bg-card border-border/50 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <ClipboardList className="text-muted-foreground mb-4 h-12 w-12 opacity-30" />
            <h3 className="text-muted-foreground text-lg font-medium">
              {searchTerm ? "Nenhuma encomenda encontrada." : "Sem tarefas pendentes no momento."}
            </h3>
          </div>
        ) : (
          filteredEncomendas.map((encomenda) => (
            <GlassCard key={encomenda.id} className="bg-card overflow-hidden p-0" hoverEffect>
              <div className="space-y-6 p-5">
                {/* Cabeçalho do Card */}
                <div className="border-border/10 flex items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-mono text-xl font-bold">
                      #{encomenda.numero_encomenda}
                    </span>
                    {encomenda.etiqueta && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 uppercase dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {encomenda.etiqueta}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold tracking-widest text-primary-foreground uppercase shadow-sm",
                      getStatusColor(encomenda.status)
                    )}
                  >
                    {encomenda.status}
                  </Badge>
                </div>

                {/* Grid de Observações (Tarefas) */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Seção Joel */}
                  <div className="space-y-3">
                    <div className="flex min-h-[32px] items-center justify-between">
                      <label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-70">
                        Instruções (Joel)
                      </label>
                      {isJoel && editing?.id !== encomenda.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(encomenda.id, "observacoes_joel")}
                          className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-blue-500/10 hover:text-blue-500 active:scale-90"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {editing?.id === encomenda.id && editing.field === "observacoes_joel" ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editing.value}
                          onChange={(e) =>
                            setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))
                          }
                          placeholder="Digite as instruções..."
                          className="bg-input border-border/50 focus:border-primary/50 text-foreground min-h-[120px] text-sm leading-relaxed"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={handleSave}
                            className="h-9 px-4 transition-all active:scale-95"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="cancel"
                            onClick={handleCancel}
                            className="h-9 px-4"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-accent border-border/10 text-foreground min-h-[120px] rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {encomenda.observacoes_joel || (
                          <span className="text-muted-foreground/40 italic">
                            Sem instruções registradas pelo Joel.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seção Felipe */}
                  <div className="border-border/10 space-y-3 lg:border-l lg:pl-8">
                    <div className="flex min-h-[32px] items-center justify-between">
                      <label className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-70">
                        Feedback de Produção (Felipe)
                      </label>
                      {isFelipe && editing?.id !== encomenda.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(encomenda.id, "observacoes_felipe")}
                          className="text-muted-foreground h-8 w-8 transition-all hover:scale-110 hover:bg-blue-500/10 hover:text-blue-500 active:scale-90"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {editing?.id === encomenda.id && editing.field === "observacoes_felipe" ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editing.value}
                          onChange={(e) =>
                            setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))
                          }
                          placeholder="Digite o feedback..."
                          className="bg-input border-border/50 focus:border-primary/50 text-foreground min-h-[120px] text-sm leading-relaxed"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={handleSave}
                            className="h-9 px-4 transition-all active:scale-95"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="cancel"
                            onClick={handleCancel}
                            className="h-9 px-4"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-accent border-border/10 text-foreground min-h-[120px] rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {encomenda.observacoes_felipe || (
                          <span className="text-muted-foreground/40 italic">
                            Sem feedback registrado pelo Felipe.
                          </span>
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
