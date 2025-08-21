
import { useUserRole } from "@/hooks/useUserRole";
import RoleBasedFinanceiro from "@/components/RoleBasedFinanceiro";
import EncomendasFinanceiro from "@/components/EncomendasFinanceiro";
import ContasPagar from "@/components/ContasPagar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Financeiro() {
  const { hasRole, loading } = useUserRole();

  const isFactory = hasRole('factory');
  const isClient = hasRole('client');
  const isAdminOrOps = hasRole('admin') || hasRole('ops');

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  // Para fornecedor e cliente, mostrar interface simplificada
  if (isFactory || isClient) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">
              {isFactory ? "Controle financeiro - A Receber" : "Controle financeiro - Minhas Contas"}
            </p>
          </div>
        </div>

        <RoleBasedFinanceiro />
      </div>
    );
  }

  // Para admin e ops, mostrar interface completa
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro completo do negócio</p>
        </div>
      </div>

      <Tabs defaultValue="receber">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="receber">
          <EncomendasFinanceiro />
        </TabsContent>

        <TabsContent value="pagar">
          <ContasPagar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
