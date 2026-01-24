import { Edit, Eye, Archive, RefreshCcw, MoreHorizontal, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/utils/activityLogger";
import { cn } from "@/lib/utils";
import { Produto } from "@/types/database";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ProdutoActionsProps {
  produto: Produto;
  onEdit: (produto: Produto) => void;
  onView: (produto: Produto) => void;
  onDuplicate: (produto: Produto) => void;
  onRefresh: () => void;
  className?: string;
}

export function ProdutoActions({
  produto,
  onEdit,
  onView,
  onDuplicate,
  onRefresh,
  className,
}: ProdutoActionsProps) {
  const { isCollaborator } = useIsCollaborator();
  const { user } = useAuth();
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";
  const isRestricted = isCollaborator || isHam;

  const handleView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onView(produto);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit(produto);
  };

  const handleDuplicate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDuplicate(produto);
  };

  const handleArchive = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const newStatus = !produto.ativo;
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: newStatus })
        .eq("id", produto.id);

      if (error) throw error;

      await logActivity({
        entity: "produto",
        entity_id: produto.id,
        action: newStatus ? "activate" : "deactivate",
        details: { nome: produto.nome },
      });

      toast.success(`Produto ${newStatus ? "reativado" : "arquivado"} com sucesso`);
      onRefresh();
    } catch (error) {
      console.error("Erro ao alternar status do produto:", error);
      toast.error("Erro ao processar solicitação");
    }
  };

  if (isHam) {
    return (
      <div className={cn("flex items-center justify-center py-1", className)}>
        <Button
          variant="ghost"
          className="group hover:bg-primary/10 hover:text-primary h-8 w-8 p-0 transition-colors"
          onClick={handleView}
          title="Visualizar"
          aria-label="Visualizar produto"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-1", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" className="group hover:bg-muted/10 h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-border/50 min-w-[140px] bg-secondary p-1.5 dark:bg-popover"
        >
          <DropdownMenuItem
            onClick={handleView}
            className="hover:text-primary hover:bg-primary/10 focus:text-primary focus:bg-primary/10 cursor-pointer py-2 transition-colors"
          >
            <Eye className="mr-2.5 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>

          {!isRestricted && (
            <DropdownMenuItem
              onClick={handleEdit}
              className="cursor-pointer py-2 transition-colors hover:bg-blue-400/10 hover:text-blue-400 focus:bg-blue-400/10 focus:text-blue-400"
            >
              <Edit className="mr-2.5 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {!isRestricted && (
            <DropdownMenuItem
              onClick={handleDuplicate}
              className="cursor-pointer py-2 transition-colors hover:bg-emerald-500/10 hover:text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500"
            >
              <Copy className="mr-2.5 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
          )}

          {!isRestricted && (
            <DropdownMenuItem
              onClick={handleArchive}
              className="cursor-pointer py-2 transition-colors hover:bg-orange-500/10 hover:text-orange-500 focus:bg-orange-500/10 focus:text-orange-500"
            >
              {produto.ativo ? (
                <>
                  <Archive className="mr-2.5 h-4 w-4" /> Arquivar
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2.5 h-4 w-4" /> Reativar
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
