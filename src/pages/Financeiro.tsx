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

  const isHam = (userEmail?.toLowerCase() ?? "") === "ham@admin.com";
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      "Resumo": { pt: "Resumo", fr: "Résumé" },
      "Vendas": { pt: "Vendas", fr: "Ventes" },
      "Compras": { pt: "Compras", fr: "Achats" },
      "Faturas": { pt: "Faturas", fr: "Factures" },
      "Mostrar inativos": { pt: "Mostrar inativos", fr: "Afficher inactifs" },
      "Carregando resumo...": { pt: "Carregando resumo...", fr: "Chargement du résumé..." },
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

      // Entradas padrão por usuário
      if (email === "ham@admin.com") {
        setActiveTab("encomendas"); // Vendas
      } else if (email === "felipe@colaborador.com") {
        setActiveTab("pagar"); // Compras
      } else {
        setActiveTab("resumo");
      }
    };

    fetchUser();
  }, []);

  // Se o ham cair em Resumo ou Compras, manda para Vendas
  useEffect(() => {
    if (isHam && (activeTab === "resumo" || activeTab === "pagar")) {
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
      const data = { a_receber: 0, a_pagar: 0, saldo: 0 };
      setResumo(data);
    } catch (error) {
      toast.error("Erro ao carregar resumo");
    } finally {
      setLoadingResumo(false);
    }
  };

  const isFelipe = (userEmail?.toLowerCase() ?? "") === "felipe@colaborador.com";

  // Regras de visibilidade:
  // - ham: sem Resumo, sem Compras
  // - felipe: sem Resumo (cards), sem Faturas (mantido do seu original)
  const hideResumoForHam = isHam;
  const hideResumoCards = isFelipe || hideResumoForHam;
  const hideFaturas = isFelipe;
  const hideCompras = isHam;

  return (
    <div className="px-4 md:px-8">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideResumoForHam && <TabsTrigger value="resumo">{t("Resumo")}</TabsTrigger>}
          <TabsTrigger value="encomendas">{t("Vendas")}</TabsTrigger>
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
          <EncomendasFinanceiro showCompleted={showInactive} />
        </TabsContent>

        {!hideCompras && (
          <TabsContent value="pagar">
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
