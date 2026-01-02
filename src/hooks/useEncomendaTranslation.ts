import { useAuth } from "@/hooks/useAuth";
import { StatusEncomenda } from "@/types/entities";

export function useEncomendaTranslation() {
    const { user } = useAuth();
    const email = (user?.email || "").toLowerCase();
    const isHam = email === "ham@admin.com";
    const lang = isHam ? "fr" : "pt";

    const t = isHam
        ? {
            orders: "Commandes",
            manageOrders: "Gérer vos commandes",
            newOrder: "Nouvelle commande",
            searchPlaceholder: "Rechercher...",
            showDelivered: "Afficher livrées",
            noOrders: "Aucune commande trouvée",
            order: "Commande",
            label: "Étiquette",
            client: "Client",
            supplier: "Fournisseur",
            status: "Statut",
            productionDate: "Date de production",
            deliveryDate: "Date de livraison",
            grossWeight: "Poids brut",
            shippingValue: "Valeur du transport",
            commission: "Commission",
            total: "Valeur Totale",
            totalCost: "Coût total",
            paid: "Montant payé",
            notes: "Observations",
            viewOrder: "Voir",
            editOrder: "Modifier",
            transportConfig: "Transport",
            select: "Sélectionner",
            loadingOrders: "Chargement...",
            createdOn: "Créée le",
            errLoad: "Erreur lors du chargement",
            printOpened: "Fenêtre d’impression ouverte",
            printError: "Erreur lors de l’ouverture de l’impression",
        }
        : {
            orders: "Encomendas",
            manageOrders: "Visão geral e gestão de pedidos",
            newOrder: "Nova Encomenda",
            searchPlaceholder: "Buscar por nº, cliente, fornecedor...",
            showDelivered: "Exibir entregues",
            noOrders: "Nenhuma encomenda encontrada",
            order: "Pedido",
            label: "Etiqueta",
            client: "Cliente",
            supplier: "Fornecedor",
            status: "Status",
            productionDate: "Data Produção",
            deliveryDate: "Data Entrega",
            grossWeight: "Peso Bruto",
            shippingValue: "Valor Frete",
            commission: "Comissão",
            total: "Valor Total",
            totalCost: "Custo Total",
            paid: "Valor Pago",
            notes: "Observações",
            viewOrder: "Visualizar",
            editOrder: "Editar",
            transportConfig: "Transporte",
            select: "Selecionar",
            loadingOrders: "Carregando encomendas...",
            createdOn: "Criada em",
            errLoad: "Erro ao carregar encomendas",
            printOpened: "Janela de impressão aberta",
            printError: "Erro ao abrir impressão",
        };

    const getStatusLabel = (status: StatusEncomenda): string => {
        if (!isHam) return status;
        switch (status) {
            case "NOVO PEDIDO":
                return "Nouvelle demande";
            case "MATÉRIA PRIMA":
                return "Matières premières";
            case "PRODUÇÃO":
                return "Production";
            case "EMBALAGENS":
                return "Emballage";
            case "TRANSPORTE":
                return "Transport";
            case "ENTREGUE":
                return "Livré";
            default:
                return status;
        }
    };

    return { t, isHam, lang, getStatusLabel };
}
