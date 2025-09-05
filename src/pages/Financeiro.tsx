import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/StatCard";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro";
import ContasPagar from "@/components/ContasPagar";
import Invoices from "@/components/Invoices";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";

const movimentacoes: any[] = [];

export default function Financeiro() {
  const { hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
  const { toast } = useToast();

  // 🔽 controla a sub-aba ativa
  const [activeTab, setActiveTab] = useState<"resumo" | "encomendas" | "pagar" | "faturas">("resumo");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // carrega encomendas (A Receber)
  const fetchEncomendas = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select(`*, clientes!inner(nome)`)
        .gt("saldo_devedor", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const encomendasFormatadas = data.map((encomenda: any) => ({
        id: encomenda.id,
        numero_encomenda: encomenda.numero_encomenda,
        cliente_nome: encomenda.clientes.nome,
        valor_total: parseFloat(encomenda.valor_total),
        valor_pago: parseFloat(encomenda.valor_pago),
        saldo_devedor: parseFloat(encomenda.saldo_devedor),
        valor_frete: parseFloat(encomenda.valor_frete || 0),
      }));

      setEncomendas(encomendasFormatadas);
    } catch (error: any) {
      console.error("Erro ao carregar encomendas financeiras:", error);
      toast({
        title: "Erro ao carregar encomendas",
        description: "Você pode não ter permissão para acessar dados financeiros",
        variant: "destructive",
      });
    }
  };

  // total a pagar (fornecedores)
  const [totalPagar, setTotalPagar] = useState<number>(0);
  const fetchTotalPagar = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("saldo_devedor_fornecedor")
        .gt("saldo_devedor_fornecedor", 0);

      if (error) throw error;

      c
