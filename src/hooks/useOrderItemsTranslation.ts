import { useLocale } from "@/contexts/LocaleContext";

export function useOrderItemsTranslation() {
    const { isRestrictedFR } = useLocale();
    const lang = isRestrictedFR ? "fr" : "pt";

    const t = (k: string) => {
        const d: Record<string, { pt: string; fr: string }> = {
            "Itens da Encomenda": { pt: "Itens da Encomenda", fr: "Articles de la commande" },
            Produto: { pt: "Produto", fr: "Produit" },
            Marca: { pt: "Marca", fr: "Marque" },
            Tipo: { pt: "Tipo", fr: "Type" },
            Qtd: { pt: "Qtd", fr: "Qté" },
            "Preço Un.": { pt: "Preço Un.", fr: "Prix Un." },
            "Custo Un.": { pt: "Custo Un.", fr: "Coût Un." },
            Subtotal: { pt: "Subtotal", fr: "Sous-total" },
            "Total dos Itens:": { pt: "Total dos Itens:", fr: "Total des articles :" },
            "Carregando itens...": { pt: "Carregando itens...", fr: "Chargement des articles..." },
            "Nenhum item encontrado": { pt: "Nenhum item encontrado", fr: "Aucun article trouvé" },
        };
        return d[k]?.[lang] || k;
    };

    return { t, lang };
}
