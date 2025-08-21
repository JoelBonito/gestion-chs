
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Search, Trash2, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProdutoForm } from "./ProdutoForm";
import { logActivity } from "@/utils/activityLogger";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  tamanho: string;
  preco_custo: number;
  preco_venda: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  fornecedor_id: string;
  fornecedores?: { nome: string };
}

export function ListaProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  useEffect(() => {
    const filtered = produtos.filter((produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.tamanho.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.fornecedores?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProdutos(filtered);
  }, [produtos, searchTerm]);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          *,
          fornecedores(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setProdutos(data as Produto[]);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingProduct(null);
    fetchProdutos();
  };

  const handleDelete = async (produto: Produto) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: false })
        .eq("id", produto.id);

      if (error) throw error;

      await logActivity({
        entity: 'produto',
        entity_id: produto.id,
        action: 'delete',
        details: { nome: produto.nome }
      });

      toast.success("Produto desativado com sucesso!");
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao desativar produto:", error);
      toast.error("Erro ao desativar produto");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Scale className="h-4 w-4" />
                  Peso (kg)
                </div>
              </TableHead>
              <TableHead>Preço Custo</TableHead>
              <TableHead>Preço Venda</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell>{produto.marca}</TableCell>
                <TableCell>{produto.tipo}</TableCell>
                <TableCell>{produto.tamanho}</TableCell>
                <TableCell className="text-center font-mono">
                  <div className="flex items-center justify-center gap-1">
                    0.50 kg
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(produto.preco_custo)}</TableCell>
                <TableCell>{formatCurrency(produto.preco_venda)}</TableCell>
                <TableCell>{produto.fornecedores?.nome || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={produto.ativo ? "default" : "secondary"}>
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(produto)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {produto.ativo && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(produto)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredProdutos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md shadow-elegant">
          <DialogHeader>
            <DialogTitle className="font-display text-primary-dark">Editar Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm 
            initialData={editingProduct} 
            isEditing={true}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
