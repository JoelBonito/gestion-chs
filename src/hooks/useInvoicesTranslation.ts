import { useAuth } from "@/hooks/useAuth";

export function useInvoicesTranslation() {
    const { user } = useAuth();
    const email = (user?.email || "").toLowerCase();
    const isRestrictedUser = email === "ham@admin.com";
    const lang = isRestrictedUser ? "fr" : "pt";

    const dict: Record<string, { pt: string; fr: string }> = {
        Faturas: { pt: "Faturas", fr: "Factures" },
        "Gestão de faturas e documentos fiscais": {
            pt: "Gestão de faturas e documentos fiscais",
            fr: "Gestion des factures et documents fiscaux",
        },
        "Nova Fatura": { pt: "Nova Fatura", fr: "Nouvelle Facture" },
        Data: { pt: "Data", fr: "Date" },
        Valor: { pt: "Valor", fr: "Valeur" },
        Descrição: { pt: "Descrição", fr: "Description" },
        Arquivo: { pt: "Arquivo", fr: "Fichier" },
        Anexos: { pt: "Anexos", fr: "Pièces jointes" },
        Ações: { pt: "Ações", fr: "Actions" },
        "Carregando faturas...": { pt: "Carregando faturas...", fr: "Chargement des factures..." },
        "Nenhuma fatura encontrada.": {
            pt: "Nenhuma fatura encontrada.",
            fr: "Aucune facture trouvée.",
        },
        "Editar Fatura": { pt: "Editar Fatura", fr: "Modifier la Facture" },
        "Atualize os dados da fatura": {
            pt: "Atualize os dados da fatura",
            fr: "Mettre à jour les données de la facture",
        },
        "Visualizar Fatura": { pt: "Visualizar Fatura", fr: "Voir la Facture" },
        Deletar: { pt: "Deletar", fr: "Supprimer" },
        "Confirmar Exclusão": { pt: "Confirmar Exclusão", fr: "Confirmer la suppression" },
        "Tem certeza que deseja deletar esta fatura?": {
            pt: "Tem certeza que deseja deletar esta fatura?",
            fr: "Êtes-vous sûr de vouloir supprimer cette facture ?",
        },
        Cancelar: { pt: "Cancelar", fr: "Annuler" },
        Salvar: { pt: "Salvar", fr: "Enregistrer" },
        "Data da fatura": { pt: "Data da fatura", fr: "Date de la facture" },
        "O valor deve ser maior que zero.": {
            pt: "O valor deve ser maior que zero.",
            fr: "La valeur doit être supérieure à zéro.",
        },
        "A data da fatura não pode ser futura.": {
            pt: "A data da fatura não pode ser futura.",
            fr: "La date de la facture ne peut pas être future.",
        },
        "Detalhes da Fatura": { pt: "Detalhes da Fatura", fr: "Détails de la Facture" },
        "Valor Total": { pt: "Valor Total", fr: "Valeur Totale" },
        Observações: { pt: "Observações", fr: "Observations" },
        "Abrir em nova aba": { pt: "Abrir em nova aba", fr: "Ouvrir dans un nouvel onglet" },
        "Não informado": { pt: "Não informado", fr: "Non renseigné" },
        "Total:": { pt: "Total:", fr: "Total :" },
        "Nouvelle Facture": { pt: "Nova Fatura", fr: "Nouvelle Facture" },
        "Remplissez les informations pour créer une nouvelle facture.": {
            pt: "Preencha os dados para criar uma nova fatura.",
            fr: "Remplissez les informations pour créer une nouvelle facture."
        },
        "Preencha os dados para criar uma nova fatura.": {
            pt: "Preencha os dados para criar uma nova fatura.",
            fr: "Remplissez les informations pour créer une nouvelle facture."
        },
    };

    const t = (k: string) => dict[k]?.[lang] || k;

    return { t, isRestrictedUser, lang };
}
