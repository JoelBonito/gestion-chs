import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Search, Plus } from "lucide-react";
import { ProdutoForm } from "./ProdutoForm";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { logActivity } from "@/utils/activityLogger";

interface Produto {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  size_label: string;
  unit_weight_kg: number;
  preco_custo: number;
  preco_venda: number;
  fornecedor_id: string;
  created_at: string;
  fornecedores?: {
    nome: string;
  };
  ativo: boolean;
}

export function ListaProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{open: boolean, produto: Produto | null}>({
    open: false,
    produto: null
  });
  const { canEdit } = useUserRole();

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          *,
          fornecedores (
            nome
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = produtos.filter(produto => {
      const searchString = `${produto.nome} ${produto.marca} ${produto.tipo} ${produto.size_label} ${produto.fornecedores?.nome}`.toLowerCase();
      return searchString.includes(term);
    });
    setProdutosFiltrados(filtered);
  }, [searchTerm, produtos]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(valor);
  };

  const formatarPeso = (peso: number) => {
    return `${peso.toFixed(2)} kg`;
  };

  const handleEdit = (produto: Produto) => {
    setEditDialog({open: true, produto});
  };

  const handleEditSuccess = () => {
    setEditDialog({open: false, produto: null});
    fetchProdutos();
    toast.success("Produto atualizado com sucesso!");
  };

  const handleToggleStatus = async (produto: Produto) => {
    if (!canEdit()) {
      toast.error("Você não tem permissão para editar produtos");
      return;
    }

    try {
      const novoStatus = !produto.ativo;
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: novoStatus })
        .eq("id", produto.id);

      if (error) throw error;

      await logActivity({
        entity: 'produto',
        entity_id: produto.id,
        action: novoStatus ? 'activate' : 'deactivate',
        details: { nome: produto.nome }
      });
      
      toast.success(`Produto ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
      toast.error("Erro ao alterar status do produto");
    }
  };

  const handleDelete = async (produto: Produto) => {
    if (!canEdit()) {
      toast.error("Você não tem permissão para deletar produtos");
      return;
    }

    if (confirm(`Tem certeza que deseja deletar o produto "${produto.nome}"? Esta ação não pode ser desfeita.`)) {
      try {
        const { error } = await supabase
          .from("produtos")
          .delete()
          .eq("id", produto.id);

        if (error) throw error;

        await logActivity({
          entity: 'produto',
          entity_id: produto.id,
          action: 'delete',
          details: { nome: produto.nome }
        });
        
        toast.success("Produto deletado com sucesso!");
        fetchProdutos();
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        toast.error("Erro ao deletar produto");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-body">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar produtos por nome, marca, tipo, tamanho ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-elegant"
            />
          </div>
        </div>
      </div>

      {produtosFiltrados.length === 0 ? (
        <Card className="shadow-card border-primary/10 bg-gradient-card">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground font-body mb-4">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm ? "Nenhum produto encontrado com os critérios de busca." : "Nenhum produto cadastrado ainda."}
            </div>
            {!searchTerm && (
              <p className="text-sm text-muted-foreground font-body font-light">
                Clique em "Cadastrar Produto" para adicionar o primeiro produto.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border border-primary/10 rounded-lg overflow-hidden shadow-card bg-gradient-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/3 hover:bg-primary/6 border-b border-primary/10">
                <TableHead className="w-[15%] min-w-[120px] font-display font-medium text-primary-dark">Nome</TableHead>
                <TableHead className="w-[10%] min-w-[80px] font-display font-medium text-primary-dark">Marca</TableHead>
                <TableHead className="w-[10%] min-w-[80px] font-display font-medium text-primary-dark">Tipo</TableHead>
                <TableHead className="w-[8%] min-w-[60px] font-display font-medium text-primary-dark">Tamanho</TableHead>
                <TableHead className="w-[8%] min-w-[60px] text-right font-display font-medium text-primary-dark">Peso</TableHead>
                <TableHead className="w-[12%] min-w-[100px] font-display font-medium text-primary-dark">Fornecedor</TableHead>
                <TableHead className="w-[10%] min-w-[80px] text-right font-display font-medium text-primary-dark">Preço Custo</TableHead>
                <TableHead className="w-[10%] min-w-[80px] text-right font-display font-medium text-primary-dark">Preço Venda</TableHead>
                <TableHead className="w-[17%] min-w-[120px] text-right font-display font-medium text-primary-dark">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosFiltrados.map((produto) => (
                <TableRow key={produto.id} className="hover:bg-primary/3 border-b border-primary/5 transition-colors">
                  <TableCell className="font-medium text-primary-dark font-display truncate max-w-[120px]" title={produto.nome}>
                    {produto.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-body">
                    {produto.marca}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-body">
                    {produto.tipo}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground font-body">{produto.size_label}</TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-sm">
                    {produto.unit_weight_kg ? formatarPeso(produto.unit_weight_kg) : "N/A"}
                  </TableCell>
                  <TableCell className="truncate max-w-[100px] text-muted-foreground font-body" title={produto.fornecedores?.nome}>
                    {produto.fornecedores?.nome || "Não informado"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatarMoeda(produto.preco_custo)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium text-primary-dark">
                    {formatarMoeda(produto.preco_venda)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit() && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(produto)}
                            className="hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(produto)}
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({open, produto: null})}>
        <DialogContent className="max-w-2xl shadow-elegant">
          <DialogHeader>
            <DialogTitle className="font-display text-primary-dark">Editar Produto</DialogTitle>
          </DialogHeader>
          {editDialog.produto && (
            <ProdutoForm 
              onSuccess={handleEditSuccess} 
              initialData={editDialog.produto}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
