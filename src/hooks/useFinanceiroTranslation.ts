import { useAuth } from "@/hooks/useAuth";

export function useFinanceiroTranslation() {
    const { user } = useAuth();
    const email = (user?.email || "").toLowerCase();
    const isHam = email === "ham@admin.com";
    const isFelipe = email === "felipe@colaborador.com";
    const lang = isHam ? "fr" : "pt";

    const t = (k: string) => {
        const d: Record<string, { pt: string; fr: string }> = {
            Vendas: { pt: "Vendas", fr: "Ventes" },
            Compras: { pt: "Compras", fr: "Achats" },
            Faturas: { pt: "Faturas", fr: "Factures" },
            "Mostrar inativos": { pt: "Mostrar inativos", fr: "Afficher inactifs" },
            "Total a Receber": { pt: "Total a Receber", fr: "Total à recevoir" },
            "Total a Pagar": { pt: "Total a Pagar", fr: "Total à payer" },
            "Saldo Atual": { pt: "Saldo Atual", fr: "Solde actuel" },
            "Carregando resumo...": { pt: "Carregando resumo...", fr: "Chargement du résumé..." },
            Financeiro: { pt: "Financeiro", fr: "Finance" },
            "Gestão completa de fluxo de caixa e faturas": {
                pt: "Gestão completa de fluxo de caixa e faturas",
                fr: "Gestion complète du flux de trésorerie et des factures",
            },
        };
        return d[k]?.[lang] ?? k;
    };

    return { t, isHam, isFelipe, lang };
}
