
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { ListaProdutos } from "@/components/ListaProdutos";
import { AttachmentManager } from "@/components/AttachmentManager";
import { toast } from "sonner";

export default function Produtos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const listaProdutosRef = useRef<{ fetchProdutos: () => void }>(null);

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    // Trigger refresh da lista através de ref
    if (listaProdutosRef.current) {
      listaProdutosRef.current.fetchProdutos();
    }
    toast.success("Produto criado e lista atualizada!");
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
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
          <DialogContent className="max-w-md shadow-elegant">
            <DialogHeader>
              <DialogTitle className="font-display text-primary-dark">Cadastrar Novo Produto</DialogTitle>
            </DialogHeader>
            <ProdutoForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Produtos</TabsTrigger>
          <TabsTrigger value="anexos" disabled={!selectedProductId}>
            Anexos {selectedProductId ? `(Produto Selecionado)` : '(Selecione um produto)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6">
          <Card className="shadow-card border-primary/10 bg-gradient-card">
            <CardHeader className="bg-primary/3 border-b border-primary/10">
              <CardTitle className="font-display text-primary-dark text-xl font-medium">Lista de Produtos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ListaProdutos 
                ref={listaProdutosRef} 
                onProductSelect={handleProductSelect}
                selectedProductId={selectedProductId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos" className="space-y-6">
          {selectedProductId ? (
            <Card className="shadow-card border-primary/10 bg-gradient-card">
              <CardHeader className="bg-primary/3 border-b border-primary/10">
                <CardTitle className="font-display text-primary-dark text-xl font-medium">
                  Anexos do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AttachmentManager 
                  entityType="produto" 
                  entityId={selectedProductId}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Selecione um produto na aba "Lista de Produtos" para gerenciar seus anexos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
