import { useAuth } from "@/hooks/useAuth";

export function useContasPagarTranslation() {
    const { user } = useAuth();
    const email = (user?.email || "").toLowerCase();
    const isHam = email === "ham@admin.com";
    const isFelipe = email === "felipe@colaborador.com";
    const lang = isHam ? "fr" : "pt";

    const dict: Record<string, { pt: string; fr: string }> = {
        "Contas a Pagar": { pt: "Contas a Pagar", fr: "Comptes à payer" },
        Pedido: { pt: "Pedido", fr: "Commande" },
        Fornecedor: { pt: "Fornecedor", fr: "Fournisseur" },
        "Valor Total": { pt: "Valor Total", fr: "Montant total" },
        "Valor Pago": { pt: "Valor Pago", fr: "Montant payé" },
        Saldo: { pt: "Saldo", fr: "Solde" },
        Data: { pt: "Data", fr: "Date" },
        Status: { pt: "Status", fr: "Statut" },
        Ações: { pt: "Ações", fr: "Actions" },
        "Ver Detalhes": { pt: "Ver Detalhes", fr: "Voir détails" },
        "Registrar Pagamento": { pt: "Registrar Pagamento", fr: "Enregistrer paiement" },
        "Anexar Comprovante": { pt: "Anexar Comprovante", fr: "Joindre justificatif" },
        "Carregando...": { pt: "Carregando...", fr: "Chargement..." },
        "Mostrar Concluídos": { pt: "Mostrar Concluídos", fr: "Afficher terminés" },
        "Compras - Fornecedores": { pt: "Compras - Fornecedores", fr: "Achats - Fournisseurs" },
        "Encomendas com saldo devedor para fornecedores": {
            pt: "Encomendas com saldo devedor para fornecedores",
            fr: "Commandes avec solde débiteur aux fournisseurs",
        },
        "Detalhes da Conta a Pagar": {
            pt: "Detalhes da Conta a Pagar",
            fr: "Détails du compte à payer",
        },
        "Comprovantes e Anexos": {
            pt: "Comprovantes e Anexos",
            fr: "Justificatifs et peças jointes",
        },
        "Comprovantes de Pagamento": {
            pt: "Comprovantes de Pagamento",
            fr: "Justificatifs de pagamento",
        },
        "Nenhuma conta a pagar encontrada": {
            pt: "Nenhuma conta a pagar encontrada",
            fr: "Aucun compte à pagar trouvé",
        },
    };

    const t = (k: string) => dict[k]?.[lang] ?? k;

    return { t, isHam, isFelipe, lang };
}
