
import Financeiro from "@/components/Financeiro";

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro do sistema</p>
        </div>
      </div>

      <Financeiro />
    </div>
  );
}
