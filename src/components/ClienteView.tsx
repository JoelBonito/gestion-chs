import { Cliente } from "@/types/database";
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
    FileText
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClienteViewProps {
    cliente: Cliente;
}

export default function ClienteView({ cliente }: ClienteViewProps) {
    const [stats, setStats] = useState({ totalOrders: 0, totalValue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data, error } = await supabase
                    .from("encomendas")
                    .select("valor_total, status")
                    .eq("cliente_id", cliente.id)
                    .eq("status", "ENTREGUE");

                if (error) throw error;

                const totalValue = data.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
                setStats({
                    totalOrders: data.length,
                    totalValue
                });
            } catch (err) {
                console.error("Erro ao buscar estatísticas do cliente:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [cliente.id]);

    return (
        <div className="space-y-6 py-2">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-popover p-4 rounded-xl border border-border/20 transition-all duration-300">
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <User className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{cliente.nome}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={cliente.active ? "success" : "destructive"} className="text-[10px] uppercase">
                            {cliente.active ? "Ativo" : "Arquivado"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Desde {new Date(cliente.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Details */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Informações de Contato
                    </h3>

                    <div className="p-4 space-y-4 border border-border/20 bg-popover rounded-xl flex-1 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-nav-reports/10 text-nav-reports shrink-0">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">E-mail</p>
                                <p className="text-sm text-foreground break-all">{cliente.email || "Não informado"}</p>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-nav-finance/10 text-nav-finance shrink-0">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">Telefone</p>
                                <p className="text-sm text-foreground">{cliente.telefone || "Não informado"}</p>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-nav-dashboard/10 text-nav-dashboard shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">Pessoa de Contato</p>
                                <p className="text-sm text-foreground">{cliente.contato || "Não informado"}</p>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-nav-clients/10 text-nav-clients shrink-0">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">Endereço</p>
                                <p className="text-sm text-foreground leading-relaxed">{cliente.endereco || "Não informado"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Details / Stats */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        Resumo de Atividade
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 flex flex-col items-center justify-center text-center border border-border/20 rounded-xl bg-popover hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Finalizadas</p>
                            <p className="text-sm font-bold text-foreground">{loading ? "..." : stats.totalOrders}</p>
                        </div>

                        <div className="p-4 flex flex-col items-center justify-center text-center border border-border/20 rounded-xl bg-popover hover:bg-nav-finance/10 transition-colors">
                            <Euro className="h-5 w-5 text-nav-finance mb-2" />
                            <p className="text-[10px] uppercase text-muted-foreground mb-1">Total Gasto</p>
                            <p className="text-sm font-bold text-foreground">
                                {loading ? "..." : stats.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-accent border border-border/20 flex-1">
                        <h4 className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Observações Gerais
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed min-h-[60px]">
                            {cliente.observacoes || "Nenhuma observação interna registrada para este cliente até o momento."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
