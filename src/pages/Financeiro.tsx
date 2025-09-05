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

  const [activeTab, setActiveTab] = useState("resumo");
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  useEffect(() => {
    fetchEncomendas();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email?.toLowerCase() ?? null);
    });
  }, []);

  const handleFinancialDataRefresh = () => {
    fetchEncomendas();
    fetchTotalPagar();
  };

  const totalReceber = encomendas.reduce((sum, e) => sum + e.saldo_devedor, 0);
  const [totalPagar, setTotalPagar] = useState<number>(0);

  const fetchTotalPagar = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("saldo_devedor_fornecedor")
        .gt("saldo_devedor_fornecedor", 0);

      if (error) throw error;

      const total = data.reduce(
        (sum: number, e: any) =>
          sum + parseFloat(e.saldo_devedor_fornecedor || 0),
        0
      );
      setTotalPagar(total);
    } catch (error) {
      console.error("Erro ao carregar total a pagar:", error);
    }
  };

  useEffect(() => {
    fetchTotalPagar();
  }, []);

  const isHam = userEmail === "ham@admin.com";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro do seu negócio</p>
        </div>
      </div>

      {/* 🔒 Esconde os cards de resumo para ham@admin.com */}
      {!isHam && !hasRole("factory") && !isCollaborator && (
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="A Pagar"
            value={`€${totalPagar.toFixed(2)}`}
            subtitle="Total a pagar a fornecedores"
            icon={<TrendingDown className="h-6 w-6" />}
            variant="warning"
          />

          <StatCard
            title="A Receber"
            value={`€${totalReceber.toFixed(2)}`}
            subtitle="Pendente de recebimento"
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />

          <StatCard
            title="Total Geral"
            value={`€${(totalReceber - totalPagar).toFixed(2)}`}
            subtitle="Diferença entre receber e pagar"
            icon={<DollarSign className="h-6 w-6" />}
            variant="default"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="space-y-4">
          <TabsList className={`grid w-full ${isRestrictedFR ? "grid-cols-2" : "grid-cols-4"}`}>
            {/* 🔒 Não mostra a tab Resumo para ham@admin.com */}
            {!isHam && !isRestrictedFR && <TabsTrigger value="resumo">Resumo</TabsTrigger>}
            <TabsTrigger value="encomendas">
              {locale === "fr-FR" ? "À recevoir" : "A Receber"}
            </TabsTrigger>
            {!isRestrictedFR && <TabsTrigger value="pagar">A Pagar</TabsTrigger>}
            <TabsTrigger value="faturas">
              {locale === "fr-FR" ? "Factures" : "Faturas"}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <Label htmlFor="show-completed">Mostrar Concluídos</Label>
            </div>
          </div>
        </div>

        {/* Conteúdos */}
        {!isHam && !hasRole("factory") && !isCollaborator && !isRestrictedFR && (
          <TabsContent value="resumo" className="space-y-6">
            {/* … conteúdo original do resumo … */}
          </TabsContent>
        )}

        <TabsContent value="encomendas">
          <EncomendasFinanceiro
            onRefreshNeeded={handleFinancialDataRefresh}
            showCompleted={showCompleted}
          />
        </TabsContent>

        {!isRestrictedFR && (
          <TabsContent value="pagar">
            <ContasPagar
              onRefreshNeeded={handleFinancialDataRefresh}
              showCompleted={showCompleted}
            />
          </TabsContent>
        )}

        <TabsContent value="faturas">
          <Invoices />
        </TabsContent>
      </Tabs>
    </div>
  );
}
