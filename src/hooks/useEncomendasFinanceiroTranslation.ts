import { useAuth } from "@/hooks/useAuth";

export function useEncomendasFinanceiroTranslation() {
    const { user } = useAuth();
    const email = (user?.email || "").toLowerCase();
    const isHam = email === "ham@admin.com";
    const lang = isHam ? "fr" : "pt";

    const dict: Record<string, { pt: string; fr: string }> = {
        // Títulos / descrições
        "Vendas - Clientes": { pt: "Vendas - Clientes", fr: "Ventes - Clients" },
        "Encomendas with saldo devedor of clientes": {
            pt: "Encomendas com saldo devedor de clientes",
            fr: "Commandes avec solde débiteur des clients",
        },
        "Mostrar Concluídos": { pt: "Mostrar Concluídos", fr: "Afficher terminés" },

        // Tabela (headers)
        "Nº Encomenda": { pt: "Nº Encomenda", fr: "N° de commande" },
        Cliente: { pt: "Cliente", fr: "Client" },
        "Data Produção": { pt: "Data Produção", fr: "Date de production" },
        Total: { pt: "Total", fr: "Total" },
        Recebido: { pt: "Recebido", fr: "Reçu" },
        Saldo: { pt: "Saldo", fr: "Solde" },
        Pagamentos: { pt: "Pagamentos", fr: "Paiements" },
        Ações: { pt: "Ações", fr: "Actions" },

        // Estados/mensagens
        "Carregando encomendas...": {
            pt: "Carregando encomendas...",
            fr: "Chargement des commandes...",
        },
        "Nenhuma conta a receber encontrada": {
            pt: "Nenhuma conta a receber encontrada",
            fr: "Aucun compte à recevoir trouvé",
        },
        "pag.": { pt: "pag.", fr: "paiem." },
        Nenhum: { pt: "Nenhum", fr: "Aucun" },

        // Botões (titles)
        "Visualizar detalhes": { pt: "Visualizar detalhes", fr: "Voir les detalhes" },
        "Registrar pagamento": { pt: "Registrar pagamento", fr: "Enregistrer um paiement" },
        "Anexar Comprovante": { pt: "Anexar Comprovante", fr: "Joindre um justificatif" },

        // Dialogs / labels de detalhes
        "Registrar Pagamento": { pt: "Registrar Pagamento", fr: "Enregistrer um pagamento" },
        "Detalhes da Conta a Receber": {
            pt: "Detalhes da Conta a Receber",
            fr: "Détails du compte client",
        },
        "Encomenda:": { pt: "Encomenda:", fr: "Commande :" },
        "Cliente:": { pt: "Cliente:", fr: "Client :" },
        "Data Produção:": { pt: "Data Produção:", fr: "Date de production :" },
        "Valor Itens:": { pt: "Valor Itens:", fr: "Prix des produits :" },
        "Valor Frete:": { pt: "Valor Frete:", fr: "Frais de port :" },
        "Total:": { pt: "Total:", fr: "Total :" },
        "Valor Recebido:": { pt: "Valor Recebido:", fr: "Montant reçu :" },
        "Recebido:": { pt: "Recebido:", fr: "Reçu :" },
        "Saldo:": { pt: "Saldo:", fr: "Solde :" },
        "Pagamentos:": { pt: "Pagamentos:", fr: "Paiements :" },
        "Quantidade de Pagamentos:": { pt: "Quantidade de Pagamentos:", fr: "Nombre de paiements :" },
        "Confira todas as informações financeiras desta venda.": {
            pt: "Confira todas as informações financeiras desta venda.",
            fr: "Consultez toutes les informations financières de cette vente.",
        },
        "Associe um novo pagamento à encomenda selecionada.": {
            pt: "Associe um novo pagamento à encomenda selecionada.",
            fr: "Associez um nouveau paiement à la commande sélectionnée.",
        },

        // Anexos
        "Comprovantes e Anexos": { pt: "Comprovantes e Anexos", fr: "Justificatifs et peças jointes" },
        "Comprovantes de Recebimento": {
            pt: "Comprovantes de Recebimento",
            fr: "Justificatifs de pagamento",
        },
    };

    const tr = (key: string) => dict[key]?.[lang] ?? key;

    return { tr, isHam, lang };
}
