
import Encomendas from "@/components/Encomendas";

export default function EncomendasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encomendas</h1>
          <p className="text-muted-foreground">Gestão de encomendas do sistema</p>
        </div>
      </div>

      <Encomendas />
    </div>
  );
}
