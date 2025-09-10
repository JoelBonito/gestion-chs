import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Produto } from "@/types/database";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { AttachmentManager } from "./AttachmentManager";

interface ProdutoViewProps {
  produto: Produto;
}

export const ProdutoView = ({ produto }: ProdutoViewProps) => {
  const { hasRole, isHardcodedAdmin } = useUserRole();
  const isCollaborator = useIsCollaborator();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display text-primary-dark">
              {produto.nome}
            </CardTitle>
            <Badge 
              variant={produto.ativo ? "default" : "secondary"} 
              className={produto.ativo ? "bg-accent text-accent-foreground" : ""}
            >
              {produto.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Marca</p>
              <p className="font-medium">{produto.marca}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{produto.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peso</p>
              <p className="font-medium">{produto.size_weight} g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preço Custo</p>
              <p className="font-medium">€ {produto.preco_custo?.toFixed(2)}</p>
            </div>
            {!hasRole('factory') && !isCollaborator && (
              <div>
                <p className="text-sm text-muted-foreground">Preço Venda</p>
                <p className="font-medium">€ {produto.preco_venda?.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{produto.ativo ? "Ativo" : "Inativo"}</p>
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">Criado em</p>
            <p className="font-medium">
              {new Date(produto.created_at).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

        </CardContent>
      </Card>

      {(isHardcodedAdmin || hasRole('factory') || hasRole('admin') || hasRole('finance') || isCollaborator) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display text-primary-dark">
              Anexos do Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentManager 
              entityType="projeto"
              entityId={produto.id}
              title="Anexos do Produto"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
