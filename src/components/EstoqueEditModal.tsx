import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Save } from "lucide-react";
import { Produto } from "@/types/database";

interface EstoqueEditModalProps {
    produto: Produto;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EstoqueEditModal({ produto, open, onOpenChange, onSuccess }: EstoqueEditModalProps) {
    const [estoque, setEstoque] = useState({
        garrafas: produto.estoque_garrafas ?? 0,
        tampas: produto.estoque_tampas ?? 0,
        rotulos: produto.estoque_rotulos ?? 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from("produtos")
                .update({
                    estoque_garrafas: estoque.garrafas,
                    estoque_tampas: estoque.tampas,
                    estoque_rotulos: estoque.rotulos,
                })
                .eq("id", produto.id);

            if (error) throw error;

            toast.success("Estoque atualizado com sucesso!");
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error("Erro ao atualizar estoque:", error);
            toast.error("Erro ao atualizar estoque");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInputClassName = (valor: number) => {
        if (valor < 0) return "border-red-500 text-red-600 font-semibold bg-red-50 dark:bg-red-950/20";
        if (valor < 200) return "border-orange-500 text-orange-600 font-semibold bg-orange-50 dark:bg-orange-950/20";
        return "border-emerald-500 text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Editar Estoque
                    </DialogTitle>
                    <DialogDescription>
                        Atualizar quantidades de estoque para <strong>{produto.nome}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="garrafas" className="text-sm font-medium">
                                Quantidade de Garrafas/Potes
                            </Label>
                            <Input
                                id="garrafas"
                                type="number"
                                value={estoque.garrafas}
                                onChange={(e) => setEstoque({ ...estoque, garrafas: parseInt(e.target.value) || 0 })}
                                className={getInputClassName(estoque.garrafas)}
                            />
                            {estoque.garrafas < 200 && (
                                <p className="text-xs text-muted-foreground">
                                    {estoque.garrafas < 0
                                        ? "⚠️ Estoque negativo"
                                        : "⚠️ Estoque baixo (< 200)"}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tampas" className="text-sm font-medium">
                                Quantidade de Tampas
                            </Label>
                            <Input
                                id="tampas"
                                type="number"
                                value={estoque.tampas}
                                onChange={(e) => setEstoque({ ...estoque, tampas: parseInt(e.target.value) || 0 })}
                                className={getInputClassName(estoque.tampas)}
                            />
                            {estoque.tampas < 200 && (
                                <p className="text-xs text-muted-foreground">
                                    {estoque.tampas < 0
                                        ? "⚠️ Estoque negativo"
                                        : "⚠️ Estoque baixo (< 200)"}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rotulos" className="text-sm font-medium">
                                Quantidade de Rótulos
                            </Label>
                            <Input
                                id="rotulos"
                                type="number"
                                value={estoque.rotulos}
                                onChange={(e) => setEstoque({ ...estoque, rotulos: parseInt(e.target.value) || 0 })}
                                className={getInputClassName(estoque.rotulos)}
                            />
                            {estoque.rotulos < 200 && (
                                <p className="text-xs text-muted-foreground">
                                    {estoque.rotulos < 0
                                        ? "⚠️ Estoque negativo"
                                        : "⚠️ Estoque baixo (< 200)"}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isSubmitting ? (
                                "Salvando..."
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
