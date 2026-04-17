import { useAuth } from "@/hooks/useAuth";

export function useFinanceiroTranslation() {
    const { user } = useAuth();
    const email = (user?.email || "").toLowerCase();
    const isHam = email === "ham@admin.com";
    const isFelipe = email === "felipe@colaborador.com";
    const isJoel = email === "jbento1@gmail.com";
    const lang = isHam ? "fr" : "pt";

    const t = (k: string) => {
        const d: Record<string, { pt: string; fr: string }> = {
            Vendas: { pt: "Vendas", fr: "Ventes" },
            Compras: { pt: "Compras", fr: "Achats" },
            Faturas: { pt: "Faturas", fr: "Factures" },
            Saldo: { pt: "Saldo", fr: "Solde" },
            "Mostrar inativos": { pt: "Mostrar inativos", fr: "Afficher inactifs" },
            "Total a Receber": { pt: "Total a Receber", fr: "Total à recevoir" },
            "Total a Pagar": { pt: "Total a Pagar", fr: "Total à payer" },
            "Saldo Atual": { pt: "Saldo Atual", fr: "Solde actuel" },
            "Saldo Real": { pt: "Saldo Real", fr: "Solde réel" },
            "Saldo por Encomenda": { pt: "Saldo por Encomenda", fr: "Solde par commande" },
            "Visão global das pendências financeiras por encomenda": {
                pt: "Visão global das pendências financeiras por encomenda",
                fr: "Vue globale des en-cours financiers par commande",
            },
            "Nº Encomenda": { pt: "Nº Encomenda", fr: "N° Commande" },
            Etiqueta: { pt: "Etiqueta", fr: "Étiquette" },
            Cliente: { pt: "Cliente", fr: "Client" },
            "A Receber": { pt: "A Receber", fr: "À recevoir" },
            "A Pagar": { pt: "A Pagar", fr: "À payer" },
            Exposição: { pt: "Exposição", fr: "Exposition" },
            "Capital já desembolsado ao fornecedor e ainda não recebido do cliente": {
                pt: "Capital já desembolsado ao fornecedor e ainda não recebido do cliente",
                fr: "Capital déjà déboursé au fournisseur et pas encore reçu du client",
            },
            "Selecionar todas": { pt: "Selecionar todas", fr: "Tout sélectionner" },
            Selecionar: { pt: "Selecionar", fr: "Sélectionner" },
            Totais: { pt: "Totais", fr: "Totaux" },
            "Totais selecionados": { pt: "Totais selecionados", fr: "Totaux sélectionnés" },
            "Buscar nº, cliente ou etiqueta...": {
                pt: "Buscar nº, cliente ou etiqueta...",
                fr: "Rechercher n°, client ou étiquette...",
            },
            "Nenhuma encomenda com pendência encontrada": {
                pt: "Nenhuma encomenda com pendência encontrada",
                fr: "Aucune commande en attente trouvée",
            },
            "Carregando saldo...": { pt: "Carregando saldo...", fr: "Chargement du solde..." },
            "Carregando resumo...": { pt: "Carregando resumo...", fr: "Chargement du résumé..." },
            Financeiro: { pt: "Financeiro", fr: "Finance" },
            "Gestão completa de fluxo de caixa e faturas": {
                pt: "Gestão completa de fluxo de caixa e faturas",
                fr: "Gestion complète du flux de trésorerie et des factures",
            },
        };
        return d[k]?.[lang] ?? k;
    };

    return { t, isHam, isFelipe, isJoel, lang };
}
