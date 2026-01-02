import { useAuth } from "@/hooks/useAuth";

export function useProdutoTranslation() {
    const { user } = useAuth();
    const userEmail = user?.email?.toLowerCase();
    const isHam = userEmail === "ham@admin.com";
    const lang: "pt" | "fr" = isHam ? "fr" : "pt";

    const t = (k: string) => {
        const d: Record<string, { pt: string; fr: string }> = {
            Produtos: { pt: "Produtos", fr: "Produits" },
            "Gestão de catálogo e lista de preços": {
                pt: "Gestão de catálogo e lista de preços",
                fr: "Gestion du catalogue et liste de prix",
            },
            "Novo Produto": { pt: "Novo Produto", fr: "Nouveau Produit" },
            "Buscar produtos...": { pt: "Buscar produtos...", fr: "Recherche de produits..." },
            Categorias: { pt: "Categorias", fr: "Catégories" },
            Fornecedores: { pt: "Fornecedores", fr: "Fournisseurs" },
            "Mostrar Inativos": { pt: "Mostrar Inativos", fr: "Afficher Inactifs" },
            Produto: { pt: "Produto", fr: "Produit" },
            Resumo: { pt: "Resumo", fr: "Résumé" },
            Fornecedor: { pt: "Fornecedor", fr: "Fournisseur" },
            Estoques: { pt: "Estoques", fr: "Stocks" },
            "Preço de Custo": { pt: "Preço de Custo", fr: "Prix de Revient" },
            "Preço de Venda": { pt: "Preço de Venda", fr: "Prix de Vente" },
            Ações: { pt: "Ações", fr: "Actions" },
            "Carregando produtos...": { pt: "Carregando produtos...", fr: "Chargement des produits..." },
            "Nenhum produto encontrado.": {
                pt: "Nenhum produto encontrado.",
                fr: "Aucun produto trouvé.",
            },
            Estoque: { pt: "Estoque", fr: "Stock" },
            "Valor de Venda": { pt: "Valor de Venda", fr: "Prix de Vente" },
            "Custo:": { pt: "Custo:", fr: "Coût:" },
            Garrafa: { pt: "Garrafa", fr: "Bouteille" },
            Tampa: { pt: "Tampa", fr: "Bouchon" },
            Rótulo: { pt: "Rótulo", fr: "Étiquette" },
            "Gar.": { pt: "Gar.", fr: "Bout." },
            "Tam.": { pt: "Tam.", fr: "Bouch." },
            "Rót.": { pt: "Rót.", fr: "Ét." },
            "Detalhes do Produto": { pt: "Detalhes do Produto", fr: "Détails du Produit" },
            "Editar Produto": { pt: "Editar Produto", fr: "Modifier le Produit" },
            "Atualize as informações do produto": {
                pt: "Atualize as informações do produto",
                fr: "Mettez à jour les informations du produit",
            },
            Novo: { pt: "Novo", fr: "Nouveau" },
            Marca: { pt: "Marca", fr: "Marque" },
            Categoria: { pt: "Categoria", fr: "Catégorie" },
            Preço: { pt: "Preço", fr: "Prix" },
            Custo: { pt: "Custo", fr: "Coût" },
            Venda: { pt: "Venda", fr: "Vente" },
        };
        return d[k]?.[lang] || k;
    };

    return { t, lang, isHam };
}
