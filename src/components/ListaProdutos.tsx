import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
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
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

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

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedProduto(null);
    carregarProdutos();
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Preço de Custo</TableHead>
              <TableHead>Preço de Venda</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell>{produto.marca}</TableCell>
                <TableCell>{produto.tipo}</TableCell>
                <TableCell>{produto.tamanho}</TableCell>
                <TableCell>{formatarMoeda(produto.preco_custo)}</TableCell>
                <TableCell>{formatarMoeda(produto.preco_venda)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(produto)}>
                    <Edit className="h-4 w-4" />
                  </Button>
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
    </>
  );
}