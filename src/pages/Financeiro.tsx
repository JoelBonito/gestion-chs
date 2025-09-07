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

  // i18n simples aqui na página (PT para todos; FR para ham@admin.com)
  const isHam = (userEmail?.toLowerCase() ?? "") === "ham@admin.com";
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      // Abas
      "Resumo": { pt: "Resumo", fr: "Résumé" },
      "Vendas": { pt: "Vendas", fr: "Ventes" },              // (ex "A Receber")
      "Compras": { pt: "Compras", fr: "Achats" },            // (ex "A Pagar")
      "Faturas": { pt: "Faturas", fr: "Factures" },

      // Controles
      "Mostrar inativos": { pt: "Mostrar inativos", fr: "Afficher inactifs" },
      "Carregando resumo...": { pt: "Carregando resumo...", fr: "Chargement du résumé..." },

      // Cards do resumo
      "Total a Receber": { pt: "Total a Receber", fr: "Total à recevoir" },
      "Total a Pagar": { pt: "Total a Pagar", fr: "Total à payer" },
      "Saldo Atual": { pt: "Saldo Atual", fr: "Solde actuel" },
    };
    return d[k]?.[lang] ?? k;
  };

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

      const email = user?.email || null;
      setUserEmail(email);

      // Redirecionamentos automáticos por usuário (mantidos do original)
      if (email === "ham@admin.com") {
        setActiveTab("encomendas"); // agora rotulada como "Vendas"
      }

      if (email === "felipe@colaborador.com") {
        setActiveTab("pagar"); // agora rotulada como "Compras"
      }
    };

    fetchUser();
  }, []);

  // Garante que, se "Compras" estiver oculta para o ham, não ficaremos na tab "pagar".
  useEffect(() => {
    if (isHam && activeTab === "pagar") {
      setActiveTab("encomendas");
    }
  }, [isHam, activeTab]);

  useEffect(() => {
    if (activeTab === "resumo") {
      fetchResumo();
    }
  }, [activeTab]);

  const fetchResumo = async () => {
    try {
      setLoadingResumo(true);
      // Mock data para resumo financeiro (mantido do original)
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

  // Regras do original + ajustes
  const isFelipe = (userEmail?.toLowerCase() ?? "") === "felipe@colaborador.com";
  const hideResumoCards = isFelipe;     // do original
  const hideFaturas = isFelipe;         // do original
  const hideCompras = isHam;            // NOVO: ham não vê "Compras" (ex "A Pagar")

  return (
    <div className="px-4 md:px-8">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideResumoCards && <TabsTrigger value="resumo">{t("Resumo")}</TabsTrigger>}
          {/* value permanece "encomendas" para não quebrar rotas/estado */}
          <TabsTrigger value="encomendas">{t("Vendas")}</TabsTrigger>
          {/* value permanece "pagar"; apenas oculta para o ham */}
          {!hideCompras && <TabsTrigger value="pagar">{t("Compras")}</TabsTrigger>}
          {!hideFaturas && <TabsTrigger value="faturas">{t("Faturas")}</TabsTrigger>}
        </TabsList>

        {!hideResumoCards && (
          <TabsContent value="resumo">
            {loadingResumo ? (
              <p className="text-muted-foreground">{t("Carregando resumo...")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Total a Receber")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.a_receber?.toFixed(2) ?? "0.00"}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Total a Pagar")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.a_pagar?.toFixed(2) ?? "0.00"}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t("Saldo Atual")}
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
            <Label htmlFor="showInactive">{t("Mostrar inativos")}</Label>
          </div>
          {/* Esta sub-aba (Vendas) continua usando o componente existente */}
          <EncomendasFinanceiro showCompleted={showInactive} />
        </TabsContent>

        {!hideCompras && (
          <TabsContent value="pagar">
            {/* Sub-aba (Compras) continua usando o componente existente */}
            <ContasPagar />
          </TabsContent>
        )}

        {!hideFaturas && (
          <TabsContent value="faturas">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
