import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Copy, Trash2, Search } from "lucide-react";
import { ProdutoForm } from "./ProdutoForm";
import { toast } from "sonner";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  tamanho: string;
  preco_custo: number;
  preco_venda: number;
  created_at: string;
}

export function ListaProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [productToDuplicate, setProductToDuplicate] = useState<Produto | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Filtrar produtos baseado no termo de pesquisa
  useEffect(() => {
    if (!searchTerm) {
      setProdutosFiltrados(produtos);
    } else {
      const filtrados = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.tamanho.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProdutosFiltrados(filtrados);
    }
  }, [produtos, searchTerm]);

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setProdutos(data || []);
      setProdutosFiltrados(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setEditDialogOpen(true);
  };

  const handleDuplicate = (produto: Produto) => {
    setProductToDuplicate(produto);
    setDuplicateDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedProduto(null);
    carregarProdutos();
  };

  const handleDuplicateSuccess = () => {
    setDuplicateDialogOpen(false);
    setProductToDuplicate(null);
    carregarProdutos();
  };

  const handleDelete = async (produto: Produto) => {
    console.log("handleDelete chamado para produto:", produto);
    
    try {
      // Primeiro verificar se o produto está sendo usado em alguma encomenda
      const { data: itensEncomenda, error: checkError } = await supabase
        .from("itens_encomenda")
        .select("id, encomenda_id, encomendas(numero_encomenda)")
        .eq("produto_id", produto.id);

      if (checkError) {
        console.error("Erro ao verificar uso do produto:", checkError);
        throw checkError;
      }

      if (itensEncomenda && itensEncomenda.length > 0) {
        const encomendas = itensEncomenda.map((item: any) => item.encomendas?.numero_encomenda).filter(Boolean);
        const listaEncomendas = encomendas.join(", ");
        toast.error(`Não é possível deletar este produto pois está sendo usado nas encomendas: ${listaEncomendas}`);
        return;
      }

      // Se não está sendo usado, confirmar deleção
      if (confirm(`Tem certeza que deseja deletar o produto "${produto.nome}"?`)) {
        console.log("Iniciando deleção do produto:", produto.id);
        const { error } = await supabase
          .from("produtos")
          .delete()
          .eq("id", produto.id);

        if (error) {
          console.error("Erro do Supabase:", error);
          throw error;
        }
        
        console.log("Produto deletado com sucesso");
        toast.success("Produto deletado com sucesso!");
        carregarProdutos();
      } else {
        console.log("Deleção cancelada pelo usuário");
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      toast.error("Erro ao deletar produto");
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(valor);
  };

  if (loading) {
    return <div className="text-center py-4">Carregando produtos...</div>;
  }

  return (
    <>
      {/* Barra de Pesquisa */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar produtos por nome, marca, tipo ou tamanho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-elegant"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="px-3"
          >
            Limpar
          </Button>
        )}
      </div>

      {produtosFiltrados.length === 0 && searchTerm ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar os termos da pesquisa</p>
        </div>
      ) : produtosFiltrados.length === 0 && !searchTerm ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum produto cadastrado ainda.
        </div>
      ) : (
      <div className="rounded-lg border border-border overflow-hidden shadow-card bg-gradient-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/3 hover:bg-primary/6 border-b border-primary/10">
              <TableHead className="w-[25%] min-w-[150px] font-display font-medium text-primary-dark">Nome</TableHead>
              <TableHead className="w-[15%] min-w-[100px] font-display font-medium text-primary-dark">Marca</TableHead>
              <TableHead className="w-[15%] min-w-[100px] font-display font-medium text-primary-dark">Tipo</TableHead>
              <TableHead className="w-[10%] min-w-[80px] font-display font-medium text-primary-dark">Tamanho</TableHead>
              <TableHead className="w-[12%] min-w-[100px] text-right font-display font-medium text-primary-dark">Preço Custo</TableHead>
              <TableHead className="w-[12%] min-w-[100px] text-right font-display font-medium text-primary-dark">Preço Venda</TableHead>
              <TableHead className="w-[11%] min-w-[120px] text-right font-display font-medium text-primary-dark">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtosFiltrados.map((produto) => (
              <TableRow key={produto.id} className="hover:bg-primary/3 transition-all duration-200 border-b border-primary/5">
                <TableCell className="font-medium truncate max-w-[150px] font-body" title={produto.nome}>
                  {produto.nome}
                </TableCell>
                <TableCell className="truncate max-w-[100px] text-muted-foreground font-body" title={produto.marca}>
                  {produto.marca}
                </TableCell>
                <TableCell className="truncate max-w-[100px] text-muted-foreground font-body" title={produto.tipo}>
                  {produto.tipo}
                </TableCell>
                <TableCell className="text-center text-muted-foreground font-body">{produto.tamanho}</TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {formatarMoeda(produto.preco_custo)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium text-primary-dark">
                  {formatarMoeda(produto.preco_venda)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDuplicate(produto)} 
                      title="Duplicar produto"
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(produto)} 
                      title="Editar produto"
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(produto)} 
                      title="Deletar produto" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Estatísticas da pesquisa */}
      {searchTerm && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Mostrando {produtosFiltrados.length} de {produtos.length} produtos
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm 
            onSuccess={handleEditSuccess}
            initialData={selectedProduto}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicar Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm 
            onSuccess={handleDuplicateSuccess}
            initialData={productToDuplicate}
            isEditing={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}