import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EncomendaStatusSelect } from "@/components/EncomendaStatusSelect";

interface Encomenda {
  id: string;
  numero_encomenda: string;
  cliente_id: string;      // ✅ incluído
  fornecedor_id: string;   // ✅ incluído
  status: string;
  created_at: string;
}

export default function Encomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEncomendas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("encomendas")
        .select("id, numero_encomenda, cliente_id, fornecedor_id, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEncomendas(data || []);
    } catch (error) {
      console.error("Erro ao carregar encomendas:", error);
      toast.error("Erro ao carregar encomendas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncomendas();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      {encomendas.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">#{e.numero_encomenda}</h3>
              <p className="text-sm text-muted-foreground">{e.status}</p>
            </div>

            {/* ✅ prop correta para o seletor de status */}
            <EncomendaStatusSelect encomendaId={e.id} onStatusChanged={fetchEncomendas} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
