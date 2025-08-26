
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { ListaProdutos } from "@/components/ListaProdutos";
import { toast } from "sonner";

export default function Produtos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const listaProdutosRef = useRef<{ fetchProdutos: () => void }>(null);

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    // Trigger refresh da lista através de ref
    if (listaProdutosRef.current) {
      listaProdutosRef.current.fetchProdutos();
    }
    toast.success("Produto criado e lista atualizada!");
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-display font-medium text-primary-dark mb-2">Produtos</h1>
          <p className="text-muted-foreground font-body font-light">Gerencie o catálogo de produtos da sua loja</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:shadow-hover transition-all duration-300 font-body font-medium px-6">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-elegant">
            <DialogHeader>
              <DialogTitle className="font-display text-primary-dark">Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            <ProdutoForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card border-primary/10 bg-gradient-card">
        <CardHeader className="bg-primary/3 border-b border-primary/10">
          <CardTitle className="font-display text-primary-dark text-xl font-medium">Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ListaProdutos ref={listaProdutosRef} />
        </CardContent>
      </Card>
    </div>
  );
}
