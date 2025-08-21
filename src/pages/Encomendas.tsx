
import { useUserRole } from "@/hooks/useUserRole";
import RoleBasedEncomendas from "@/components/RoleBasedEncomendas";
import { Card, CardContent } from "@/components/ui/card";

export default function Encomendas() {
  const { loading } = useUserRole();

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gestão de encomendas do sistema</p>
        </div>
      </div>

      <RoleBasedEncomendas />
    </div>
  );
}
