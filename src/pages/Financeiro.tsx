// src/pages/Financeiro.tsx
import { useEffect, useState, useMemo } from "react";
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

  const isHam = useMemo(() => (userEmail || "").toLowerCase() === "ham@admin.com", [userEmail]);
  const isFelipe = useMemo(() => (userEmail || "").toLowerCase() === "felipe@colaborador.com", [userEmail]);

  // Dicionário PT/FR (somente rótulos visíveis nesta página)
  const t = isHam
    ? {
        resumo: "Résumé",
        aReceber: "À recevoir",
        aPagar: "À payer",
        faturas: "Factures",
        carregandoResumo: "Chargement du résumé...",
        totalReceber: "Total à recevoir",
        totalPagar: "Total à payer",
        saldoAtual: "Solde actuel",
        mostrarInativos: "Afficher inactifs",
        erroUsuario: "Erreur lors de la récupération de l’utilisateur",
        erroResumo: "Erreur lors du chargement du résumé",
      }
    : {
        resumo: "Resumo",
        aReceber: "A Receber",
        aPagar: "A Pagar",
        faturas: "Faturas",
        carregandoResumo: "Carregando resumo...",
        totalReceber: "Total a Receber",
        totalPagar: "Total a Pagar",
        saldoAtual: "Saldo Atual",
        mostrarInativos: "Mostrar inativos",
        erroUsuario: "Erro ao buscar usuário",
        erroResumo: "Erro ao carregar resumo",
      };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        toast.error(t.erroUsuario);
        return;
      }

      const email = user?.email || null;
      setUserEmail(email);

      // Redirecionamentos automáticos por usuário
      if (email === "ham@admin.com") {
        setActiveTab("encomendas"); // entra direto em A Receber
      }
      if (email === "felipe@colaborador.com") {
        setActiveTab("pagar");
      }
    };

    fetchUser();
  }, [t.erroUsuario]);

  useEffect(() => {
    if (activeTab === "resumo" && !isHam) {
      fetchResumo();
    }
  }, [activeTab, isHam]);

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
      toast.error(t.erroResumo);
    } finally {
      setLoadingResumo(false);
    }
  };

  // Regras de visibilidade por usuário (mínima alteração do original):
  // - ham: mostrar SOMENTE "encomendas" (A Receber) e "faturas"
  // - felipe: já havia regras para esconder Resumo/A Receber/Faturas
  const hideResumoCards = isFelipe || isHam;
  const hideFaturas = isFelipe ? true : false;     // ham vê Faturas
  const hideAPagar = isHam ? true : false;         // ham não vê A Pagar

  return (
    <div className="px-4 md:px-8">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)}>
        <TabsList className="mb-4">
          {!hideResumoCards && <TabsTrigger value="resumo">{t.resumo}</TabsTrigger>}
          <TabsTrigger value="encomendas">{t.aReceber}</TabsTrigger>
          {!hideAPagar && <TabsTrigger value="pagar">{t.aPagar}</TabsTrigger>}
          {!hideFaturas && <TabsTrigger value="faturas">{t.faturas}</TabsTrigger>}
        </TabsList>

        {!hideResumoCards && (
          <TabsContent value="resumo">
            {loadingResumo ? (
              <p className="text-muted-foreground">{t.carregandoResumo}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t.totalReceber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.a_receber?.toFixed(2) ?? "0.00"}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t.totalPagar}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    € {resumo?.a_pagar?.toFixed(2) ?? "0.00"}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t.saldoAtual}
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

        {/* A Receber (sempre mostrado, inclusive para ham) */}
        <TabsContent value="encomendas">
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="showInactive"
              checked={showInactive}
              onCheckedChange={() => setShowInactive(!showInactive)}
            />
            <Label htmlFor="showInactive">{t.mostrarInativos}</Label>
          </div>
          <EncomendasFinanceiro showCompleted={showInactive} />
        </TabsContent>

        {/* A Pagar (oculto para ham) */}
        {!hideAPagar && (
          <TabsContent value="pagar">
            <ContasPagar />
          </TabsContent>
        )}

        {/* Faturas (ham vê) */}
        {!hideFaturas && (
          <TabsContent value="faturas">
            <Invoices />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
