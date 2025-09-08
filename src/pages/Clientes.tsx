import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  ativo: boolean;
  created_at: string;
}

export default function Clientes() {
  const { canEdit } = useUserRole(); // ✅ hook usado dentro do componente
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const fetchClientes = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("clientes")
        .select("id, nome, email, telefone, endereco, ativo, created_at")
        .order("created_at", { ascending: false });

      // filtro ativo/inativo direto no SQL
      query = query.eq("ativo", !showInactive);

      if (searchTerm) {
        query = query.or(
          `nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, showInactive]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        {canEdit && <Button>+ Novo Cliente</Button>}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive">Mostrar inativos</Label>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente) => (
            <Card key={cliente.id}>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold">{cliente.nome}</h3>
                <p className="text-sm text-muted-foreground">{cliente.email}</p>
                <p className="text-sm">{cliente.telefone}</p>
                <p className="text-sm">{cliente.endereco}</p>
                <p className="text-xs text-muted-foreground">
                  Criado em: {new Date(cliente.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm mt-2">
                  Status: {cliente.ativo ? "Ativo ✅" : "Inativo ❌"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
