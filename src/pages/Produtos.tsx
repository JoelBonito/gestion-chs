import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, ArrowUpAZ, ArrowDownAZ, Search } from "lucide-react";
import { ProdutoForm } from "@/components/ProdutoForm";
import { ListaProdutos } from "@/components/ListaProdutos";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ListaProdutosRef = { fetchProdutos: () => void };

export default function Produtos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const listaProdutosRef = useRef<ListaProdutosRef>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"nameAsc" | "nameDesc">("nameAsc");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email?.toLowerCase() ?? null);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    listaProdutosRef.current?.fetchProdutos();
    toast.success("Produto criado e lista atualizada!");
  };

  const isFelipe = userEmail === "felipe@colaborador.com";

  const toggleSort = () => {
    setSort((s) => (s === "nameAsc" ? "nameDesc" : "nameAsc"));
  };

  const sortIcon = sort === "nameAsc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />;
  const sortLabel = sort === "nameAsc" ? "A–Z" : "Z–A";

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-medium text-primary-dark mb-2">Produtos</h1>
          <p className="text-muted-foreground font-body font-light">
            Gerencie o catálogo de produtos da sua loja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleSort}>
            {sortIcon}
            <span className="ml-2">{sortLabel}</span>
          </Button>

          {!isFelipe && (
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
          )}
        </div>
      </div>

      <Card className="shadow-card border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, marca ou tipo…"
                className="pl-9"
              />
            </div>

            <Button variant="outline" onClick={() => { setSearch(""); setDebouncedSearch(""); }}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-primary/10 bg-gradient-card">
        <CardHeader cla
