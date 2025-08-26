
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Search } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { deleteProduto } from "@/lib/produto-actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  preco_custo: number;
  preco_venda: number;
  size_weight: number;
  ativo: boolean;
  fornecedor_id: string;
  created_at: string;
  updated_at: string;
}

interface ListaProdutosProps {
  onProductSelect?: (productId: string) => void;
  selectedProductId?: string;
}

export const ListaProdutos = React.forwardRef<
  { fetchProdutos: () => void },
  ListaProdutosProps
>(({ onProductSelect, selectedProductId }, ref) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProdutos(data || []);
      setFilteredProdutos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  React.useImperativeHandle(ref, () => ({
    fetchProdutos: () => {
      fetchProdutos();
    },
  }));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    const filtered = produtos.filter((produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProdutos(filtered);
  };

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduto(id);
      toast({
        title: "Produto deletado!",
        description: "Produto deletado com sucesso.",
      });
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    fetchProdutos();
    toast({
      title: "Produto atualizado!",
      description: "Produto atualizado com sucesso.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar produto..."
          value={search}
          onChange={handleSearch}
          className="w-full max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProdutos.map((produto) => (
          <Card 
            key={produto.id} 
            className={cn(
              "hover:shadow-md transition-all duration-200 cursor-pointer border-2",
              selectedProductId === produto.id 
                ? "border-primary bg-primary/5" 
                : "border-transparent hover:border-primary/30"
            )}
            onClick={() => onProductSelect?.(produto.id)}
          >
            <CardHeader>
              <CardTitle>{produto.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{produto.marca} - {produto.tipo}</CardDescription>
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Custo: €{produto.preco_custo.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Venda: €{produto.preco_venda.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(produto);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(produto.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <CardTitle><Skeleton className="h-5 w-40" /></CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription><Skeleton className="h-4 w-60" /></CardDescription>
                <div className="mt-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md shadow-elegant">
          <DialogHeader>
            <DialogTitle className="font-display text-primary-dark">Editar Produto</DialogTitle>
          </DialogHeader>
          {selectedProduto && (
            <ProdutoForm
              initialData={selectedProduto}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
