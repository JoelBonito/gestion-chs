// src/components/TarefasTab.tsx
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Encomenda = {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  observacoes_joel?: string | null;
  observacoes_felipe?: string | null;
};

export function TarefasTab() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [filteredEncomendas, setFilteredEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingStates, setEditingStates] = useState<{
    [key: string]: { joel: boolean; felipe: boolean; joelValue: string; felipeValue: string };
  }>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    fetchEncomendas();
  }, []);

  useEffect(() => {
    const filtered = encomendas.filter((encomenda) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        encomenda.numero_encomenda.toLowerCase().includes(searchLower) ||
        (encomenda.etiqueta || "").toLowerCase().includes(searchLower)
      );
    });
    setFilteredEncomendas(filtered);
  }, [encomendas, searchTerm]);

  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";
  const isJoel = email === "jbento1@gmail.com" || email === "admin@admin.com";

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("encomendas")
        .select("id, numero_encomenda, etiqueta, observacoes_joel, observacoes_felipe")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEncomendas(data || []);
      
      // Initialize editing states
      const initialStates: typeof editingStates = {};
      (data || []).forEach((encomenda) => {
        initialStates[encomenda.id] = {
          joel: false,
          felipe: false,
          joelValue: encomenda.observacoes_joel || "",
          felipeValue: encomenda.observacoes_felipe || "",
        };
      });
      setEditingStates(initialStates);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (encomendaId: string, type: "joel" | "felipe") => {
    setEditingStates((prev) => ({
      ...prev,
      [encomendaId]: {
        ...prev[encomendaId],
        [type]: true,
      },
    }));
  };

  const handleCancelEdit = (encomendaId: string, type: "joel" | "felipe") => {
    const encomenda = encomendas.find((e) => e.id === encomendaId);
    if (!encomenda) return;

    setEditingStates((prev) => ({
      ...prev,
      [encomendaId]: {
        ...prev[encomendaId],
        [type]: false,
        [`${type}Value`]: type === "joel" ? encomenda.observacoes_joel || "" : encomenda.observacoes_felipe || "",
      },
    }));
  };

  const handleSaveEdit = async (encomendaId: string, type: "joel" | "felipe") => {
    const currentState = editingStates[encomendaId];
    if (!currentState) return;

    const fieldName = type === "joel" ? "observacoes_joel" : "observacoes_felipe";
    const newValue = type === "joel" ? currentState.joelValue : currentState.felipeValue;

    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ [fieldName]: newValue })
        .eq("id", encomendaId);

      if (error) throw error;

      // Update local state
      setEncomendas((prev) =>
        prev.map((encomenda) =>
          encomenda.id === encomendaId ? { ...encomenda, [fieldName]: newValue } : encomenda
        )
      );

      setEditingStates((prev) => ({
        ...prev,
        [encomendaId]: {
          ...prev[encomendaId],
          [type]: false,
        },
      }));

      toast.success(`Observações ${type === "joel" ? "Joel" : "Felipe"} salvas!`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar observações");
    }
  };

  const handleInputChange = (encomendaId: string, type: "joel" | "felipe", value: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [encomendaId]: {
        ...prev[encomendaId],
        [`${type}Value`]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Search */}
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full max-w-sm" />
          </CardContent>
        </Card>

        {/* Skeleton Cards */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tarefas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie observações das encomendas
        </p>
      </div>

      {/* Search */}
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

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredEncomendas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredEncomendas.map((encomenda) => {
            const editState = editingStates[encomenda.id];
            if (!editState) return null;

            return (
              <Card key={encomenda.id} className="shadow-card transition-all duration-300 hover:shadow-hover">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold text-primary-dark">
                        #{encomenda.numero_encomenda}
                      </CardTitle>
                      {encomenda.etiqueta && (
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit mt-2">
                          {encomenda.etiqueta}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Observações Joel */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Observações Joel
                      </h3>
                      {isJoel && !editState.joel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(encomenda.id, "joel")}
                          className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Editar
                        </Button>
                      )}
                    </div>

                    {editState.joel ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          rows={4}
                          value={editState.joelValue}
                          onChange={(e) => handleInputChange(encomenda.id, "joel", e.target.value)}
                          placeholder="Adicione observações..."
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(encomenda.id, "joel")}
                            className="w-full sm:w-auto"
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelEdit(encomenda.id, "joel")}
                            className="w-full sm:w-auto"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted/40 p-4 min-h-[60px] text-sm whitespace-pre-wrap break-words">
                        {encomenda.observacoes_joel || "—"}
                      </div>
                    )}
                  </div>

                  {/* Observações Felipe */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Observações Felipe
                      </h3>
                      {isFelipe && !editState.felipe && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(encomenda.id, "felipe")}
                          className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Editar
                        </Button>
                      )}
                    </div>

                    {editState.felipe ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          rows={4}
                          value={editState.felipeValue}
                          onChange={(e) => handleInputChange(encomenda.id, "felipe", e.target.value)}
                          placeholder="Adicione observações..."
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(encomenda.id, "felipe")}
                            className="w-full sm:w-auto"
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelEdit(encomenda.id, "felipe")}
                            className="w-full sm:w-auto"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted/40 p-4 min-h-[60px] text-sm whitespace-pre-wrap break-words">
                        {encomenda.observacoes_felipe || "—"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
