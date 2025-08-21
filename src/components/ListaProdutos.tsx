import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Copy, Trash2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [productToDuplicate, setProductToDuplicate] = useState<Produto | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

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
    if (confirm(`Tem certeza que deseja deletar o produto "${produto.nome}"?`)) {
      try {
        const { error } = await supabase
          .from("produtos")
          .delete()
          .eq("id", produto.id);

        if (error) throw error;
        
        toast.success("Produto deletado com sucesso!");
        carregarProdutos();
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        toast.error("Erro ao deletar produto");
      }
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

  if (produtos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum produto cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%] min-w-[150px]">Nome</TableHead>
              <TableHead className="w-[15%] min-w-[100px]">Marca</TableHead>
              <TableHead className="w-[15%] min-w-[100px]">Tipo</TableHead>
              <TableHead className="w-[10%] min-w-[80px]">Tamanho</TableHead>
              <TableHead className="w-[12%] min-w-[100px] text-right">Preço Custo</TableHead>
              <TableHead className="w-[12%] min-w-[100px] text-right">Preço Venda</TableHead>
              <TableHead className="w-[11%] min-w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id} className="hover:bg-muted/50">
                <TableCell className="font-medium truncate max-w-[150px]" title={produto.nome}>
                  {produto.nome}
                </TableCell>
                <TableCell className="truncate max-w-[100px]" title={produto.marca}>
                  {produto.marca}
                </TableCell>
                <TableCell className="truncate max-w-[100px]" title={produto.tipo}>
                  {produto.tipo}
                </TableCell>
                <TableCell className="text-center">{produto.tamanho}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatarMoeda(produto.preco_custo)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">
                  {formatarMoeda(produto.preco_venda)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(produto)} title="Duplicar produto">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(produto)} title="Editar produto">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(produto)} title="Deletar produto" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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