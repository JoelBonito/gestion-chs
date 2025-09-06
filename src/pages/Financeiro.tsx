import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro";
import ContasPagar from "@/components/ContasPagar";
import Invoices from "@/components/Invoices";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

type TabKey = "resumo" | "encomendas" | "pagar" | "faturas";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<TabKey>("resumo");
  const [resumo, setResumo] = useState<any>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { hasRole } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        toast.error("Erro ao buscar usuário");
        return;
      }

      setUserEmail(user?.email || null);

      // Redirecionamentos automáticos por usuário
      if (user?.email === "ham@admin.com") {
        setActiveTab("encomendas");
      }

      if (user?.email === "felipe@colaborador.com") {
        setActiveTab("pagar");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab === "resumo") {
      fetchResumo();
    }
  }, [activeTab]);

  const fetchResumo = async () => {
    try {
      setLoadingResumo(true);
      // Mock data para resumo financeiro
      const data = {
        a_receber: 0,
        a_pagar: 0,
        saldo: 0
      };
      setResumo(data);
    } catch (error) {
      toast.error("Erro ao carregar resumo");
    } finally {
      setLoadingResumo(false);
    }
  };

  const hideResumoCards = userEmail === "felipe@colaborador.com";
  const hideAReceber = userEmail === "felipe@colaborador.com";
  const hideFaturas = userEmail === "felipe@colaborador.com";

  return (
    <div className="px-4 md:px-8">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideResumoCards && <TabsTrigger value="resumo">Resumo</TabsTrigger>}
          <TabsTrigger value="encomendas">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          {!hideFaturas && <TabsTrigger value="faturas">Faturas</TabsTrigger>}
        </TabsList>

        {!hideResumoCards && (
          <TabsContent value="resumo">
            {loadingResumo ? (
              <p className="text-muted-foreground">Carregando resumo...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total a Receber
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.a_receber?.toFixed(2) ?? "0.00"}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total a Pagar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.a_pagar?.toFixed(2) ?? "0.00"}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Saldo Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.saldo ?? "0.00"}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="encomendas">
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="showInactive"
              checked={showInactive}
              onCheckedChange={() => setShowInactive(!showInactive)}
            />
            <Label htmlFor="showInactive">Mostrar inativos</Label>
          </div>
          <EncomendasFinanceiro showCompleted={showInactive} />
        </TabsContent>

        <TabsContent value="pagar">
          <ContasPagar />
        </TabsContent>

        {!hideFaturas && (
          <TabsContent value="faturas">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
