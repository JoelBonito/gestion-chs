// src/components/EncomendaView.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";
import { cn } from "@/lib/utils";

type Encomenda = {
  id: string;
  numero_encomenda: string;
  etiqueta?: string | null;
  status: string;
  valor_total?: number | null;
  valor_pago?: number | null;
  data_criacao?: string | null;
  data_producao_estimada?: string | null;
  data_envio_estimada?: string | null;
  observacoes?: string | null;
  clientes?: { nome?: string | null } | null;
  fornecedores?: { nome?: string | null } | null;
};

type ItemEncomenda = {
  id: string;
  quantidade: number | null;
  preco_unitario: number | null;
  preco_custo: number | null;
  produtos?: { nome?: string | null } | null;
};

type Props = {
  encomendaId: string | { id?: string | number } | null | undefined;
};

export default function EncomendaView({ encomendaId }: Props) {
  const { formatCurrency, formatDate } = useFormatters();

  // Normaliza id (evita eq.[object Object])
  const id = useMemo(() => {
    if (!encomendaId) return "";
    if (typeof encomendaId === "string") return encomendaId;
    if (typeof encomendaId === "object" && encomendaId.id != null) return String(encomendaId.id);
    return "";
  }, [encomendaId]);

  const [encomenda, setEncomenda] = useState<Encomenda | null>(null);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItens, setLoadingItens] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);
  const email = (userEmail || "").toLowerCase();
  const isFelipe = email === "felipe@colaborador.com";
  const isHam = email === "ham@admin.com";

  // Dicionário (FR para Ham, PT para d
