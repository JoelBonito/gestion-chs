import { Fornecedor } from "@/types/database";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  ClipboardList,
  Euro,
  CheckCircle2,
  FileText,
  Package,
} from "lucide-react";
import { GlassCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FornecedorViewProps {
  fornecedor: Fornecedor & {
    email?: string;
    telefone?: string;
    endereco?: string;
    contato?: string;
    created_at?: string;
  };
}

export default function FornecedorView({ fornecedor }: FornecedorViewProps) {
  const [stats, setStats] = useState({ totalOrders: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("encomendas")
          .select("valor_total_custo, status")
          .eq("fornecedor_id", fornecedor.id)
          .eq("status", "ENTREGUE");

        if (error) throw error;

        const totalValue = data.reduce((acc, curr) => acc + (curr.valor_total_custo || 0), 0);
        setStats({
          totalOrders: data.length,
          totalValue,
        });
      } catch (err) {
        console.error("Erro ao buscar estatísticas do fornecedor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [fornecedor.id]);

  return (
    <div className="space-y-6 py-2">
      {/* Header Info */}
      <div className="bg-popover border-border/20 flex flex-col items-start gap-4 rounded-xl border p-4 transition-all duration-300 sm:flex-row sm:items-center">
        <div className="bg-primary/10 text-primary rounded-full p-4">
          <User className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-xl font-bold">{fornecedor.nome}</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant={fornecedor.active ? "success" : "destructive"}
              className="text-[10px] uppercase"
            >
              {fornecedor.active ? "Ativo" : "Arquivado"}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              Desde{" "}
              {fornecedor.created_at ? new Date(fornecedor.created_at).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Contact Details */}
        <div className="flex h-full flex-col space-y-4">
          <h3 className="text-muted-foreground flex items-center gap-2 px-1 text-sm font-semibold tracking-wider uppercase">
            <ShieldCheck className="text-primary h-4 w-4" />
            Informações de Contato
          </h3>

          <div className="border-border/20 bg-popover flex-1 space-y-4 rounded-xl border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-nav-reports/10 text-nav-reports shrink-0 rounded-full p-2">
                <Mail className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">E-mail</p>
                <p className="text-foreground text-sm break-all">
                  {fornecedor.email || "Não informado"}
                </p>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex items-start gap-3">
              <div className="bg-nav-finance/10 text-nav-finance shrink-0 rounded-full p-2">
                <Phone className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">Telefone</p>
                <p className="text-foreground text-sm">{fornecedor.telefone || "Não informado"}</p>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex items-start gap-3">
              <div className="bg-nav-dashboard/10 text-nav-dashboard shrink-0 rounded-full p-2">
                <User className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">
                  Pessoa de Contato
                </p>
                <p className="text-foreground text-sm">{fornecedor.contato || "Não informado"}</p>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex items-start gap-3">
              <div className="bg-nav-clients/10 text-nav-clients shrink-0 rounded-full p-2">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">Endereço</p>
                <p className="text-foreground text-sm leading-relaxed">
                  {fornecedor.endereco || "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Details / Stats */}
        <div className="flex h-full flex-col space-y-4">
          <h3 className="text-muted-foreground flex items-center gap-2 px-1 text-sm font-semibold tracking-wider uppercase">
            <ClipboardList className="text-primary h-4 w-4" />
            Resumo de Atividade
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="border-border/20 bg-popover flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-colors hover:bg-emerald-500/10">
              <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-500" />
              <p className="text-muted-foreground mb-1 text-[10px] uppercase">Finalizadas</p>
              <p className="text-foreground text-sm font-bold">
                {loading ? "..." : stats.totalOrders}
              </p>
            </div>

            <div className="border-border/20 bg-popover hover:bg-nav-finance/10 flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-colors">
              <Euro className="text-nav-finance mb-2 h-5 w-5" />
              <p className="text-muted-foreground mb-1 text-[10px] uppercase">Total Gasto</p>
              <p className="text-foreground text-sm font-bold">
                {loading
                  ? "..."
                  : stats.totalValue.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
              </p>
            </div>
          </div>

          <div className="bg-accent border-border/20 mt-4 flex-1 rounded-xl border p-4">
            <h4 className="text-primary mb-2 flex items-center gap-2 text-xs font-bold uppercase">
              <FileText className="h-3.5 w-3.5" />
              Observações Gerais
            </h4>
            <p className="text-muted-foreground min-h-[60px] text-xs leading-relaxed">
              {fornecedor.observacoes ||
                "Nenhuma observação interna registrada para este fornecedor até o momento."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
