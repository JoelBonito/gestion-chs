import { useState, useEffect } from "react";
import { Package, Clock, Truck } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  ProducaoStats,
  ProducaoFilters,
  ProducaoTable
} from "@/components/producao";

interface ItemEncomenda {
  id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produtos?: { nome: string; marca: string; tipo: string };
}

interface Encomenda {
  id: string;
  numero_encomenda: string;
  valor_total: number;
  status_producao: string;
  data_criacao: string;
  data_producao_estimada?: string;
  data_envio_estimada?: string;
  observacoes?: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

export default function Producao() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [itensEncomenda, setItensEncomenda] = useState<ItemEncomenda[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(
          `
          *,
          clientes(nome),
          fornecedores(nome)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

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

  const atualizarStatusProducao = async (encomendaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ status_producao: novoStatus })
        .eq("id", encomendaId);

      if (error) {
        throw error;
      }

      toast.success("Status de produção atualizado!");
      fetchEncomendas();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const atualizarDataProducao = async (encomendaId: string, novaData: Date | undefined) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ data_producao_estimada: novaData ? format(novaData, "yyyy-MM-dd") : null })
        .eq("id", encomendaId);

      if (error) {
        throw error;
      }

      toast.success("Data de produção atualizada!");
      fetchEncomendas();
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  const atualizarDataEnvio = async (encomendaId: string, novaData: Date | undefined) => {
    try {
      const { error } = await supabase
        .from("encomendas")
        .update({ data_envio_estimada: novaData ? format(novaData, "yyyy-MM-dd") : null })
        .eq("id", encomendaId);

      if (error) {
        throw error;
      }

      toast.success("Data de envio atualizada!");
      fetchEncomendas();
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
      toast.error("Erro ao atualizar data");
    }
  };

  const fetchItensEncomenda = async (encomendaId: string) => {
    setLoadingItens(true);
    try {
      const { data, error } = await supabase
        .from("itens_encomenda")
        .select(
          `
          *,
          produtos!inner(nome, marca, tipo)
        `
        )
        .eq("encomenda_id", encomendaId);

      if (error) {
        throw error;
      }

      setItensEncomenda(data || []);
    } catch (error) {
      console.error("Erro ao carregar itens da encomenda:", error);
      toast.error("Erro ao carregar itens da encomenda");
    } finally {
      setLoadingItens(false);
    }
  };

  const handleVerEncomenda = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    fetchItensEncomenda(encomenda.id);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PEDIDO: { label: "Pedido", variant: "secondary" as const, icon: Package },
      PRODUCAO: { label: "Produção", variant: "default" as const, icon: Clock },
      ENTREGA: { label: "Entrega", variant: "outline" as const, icon: Truck },
    };
    return variants[status as keyof typeof variants] || variants.PEDIDO;
  };

  const getStatusCounts = () => {
    return {
      PEDIDO: encomendas.filter((e) => e.status_producao === "PEDIDO").length,
      PRODUCAO: encomendas.filter((e) => e.status_producao === "PRODUCAO").length,
      ENTREGA: encomendas.filter((e) => e.status_producao === "ENTREGA").length,
      total: encomendas.length,
    };
  };

  const filteredEncomendas = encomendas.filter((encomenda) => {
    const clienteNome = encomenda.clientes?.nome || "";
    const matchesSearch =
      clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encomenda.numero_encomenda.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || encomenda.status_producao === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-foreground text-2xl font-bold sm:text-3xl">Produção</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie o status de produção das encomendas
          </p>
        </div>
      </div>

      <ProducaoStats stats={statusCounts} />

      <ProducaoFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <Card className="shadow-card bg-card">
        <CardHeader>
          <CardTitle>Controle de Produção</CardTitle>
          <CardDescription>{filteredEncomendas.length} encomenda(s) encontrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <ProducaoTable
            encomendas={filteredEncomendas}
            loading={loading}
            onUpdateStatus={atualizarStatusProducao}
            onUpdateDataProducao={atualizarDataProducao}
            onUpdateDataEnvio={atualizarDataEnvio}
            onVerEncomenda={handleVerEncomenda}
            getStatusBadge={getStatusBadge}
            itensEncomenda={itensEncomenda}
            loadingItens={loadingItens}
            selectedEncomenda={selectedEncomenda}
          />
        </CardContent>
      </Card>
    </div>
  );
}
