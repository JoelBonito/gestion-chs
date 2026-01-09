import { Eye, Calendar, Package, FileText, User, Droplets, Palette, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Amostra {
    id: string;
    data: string;
    referencia: string;
    cliente_id?: string;
    projeto?: string;
    tipo_produto?: string;
    cor?: string;
    textura?: string;
    fragrancia?: string;
    ingredientes_adicionais?: string;
    quantidade_amostras: number;
    data_envio?: string;
    observacoes?: string;
    created_at: string;
    clientes?: { nome: string };
    nome?: string;
}

interface AmostraViewProps {
    amostra: Amostra;
}

export default function AmostraView({ amostra }: AmostraViewProps) {
    return (
        <div className="space-y-6 py-2">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-popover p-4 rounded-xl border border-border/20 hover:border-primary/50 transition-all duration-300">
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <Package className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground truncate">{amostra.referencia}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(amostra.data).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Principais */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Informações Principais
                    </h3>

                    <GlassCard className="p-4 space-y-4 border-none shadow-inner bg-popover flex-1">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-nav-dashboard/10 text-nav-dashboard shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">Cliente</p>
                                <p className="text-sm text-foreground">{amostra.clientes?.nome || amostra.nome || "—"}</p>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                                <Package className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">Projeto</p>
                                <p className="text-sm text-foreground">{amostra.projeto || "—"}</p>
                            </div>
                        </div>

                        <Separator className="bg-border/40" />

                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                                <Package className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] uppercase text-muted-foreground font-medium">Quantidade</p>
                                <p className="text-sm text-foreground font-bold">{amostra.quantidade_amostras} amostras</p>
                            </div>
                        </div>

                        {amostra.data_envio && (
                            <>
                                <Separator className="bg-border/40" />
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-500 shrink-0">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Data de Envio</p>
                                        <p className="text-sm text-foreground">{new Date(amostra.data_envio).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </GlassCard>
                </div>

                {/* Características */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Características
                    </h3>

                    <GlassCard className="p-4 space-y-4 border-none shadow-inner bg-popover flex-1">
                        {amostra.tipo_produto && (
                            <>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-purple-500/10 text-purple-500 shrink-0">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Tipo de Produto</p>
                                        <p className="text-sm text-foreground">{amostra.tipo_produto}</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/40" />
                            </>
                        )}

                        {amostra.cor && (
                            <>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-pink-500/10 text-pink-500 shrink-0">
                                        <Palette className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Cor</p>
                                        <p className="text-sm text-foreground">{amostra.cor}</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/40" />
                            </>
                        )}

                        {amostra.textura && (
                            <>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                                        <Eye className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Textura</p>
                                        <p className="text-sm text-foreground">{amostra.textura}</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/40" />
                            </>
                        )}

                        {amostra.fragrancia && (
                            <>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 shrink-0">
                                        <Droplets className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Fragrância</p>
                                        <p className="text-sm text-foreground">{amostra.fragrancia}</p>
                                    </div>
                                </div>
                                <Separator className="bg-border/40" />
                            </>
                        )}

                        {amostra.ingredientes_adicionais && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-green-500/10 text-green-500 shrink-0">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Ingredientes Adicionais</p>
                                    <p className="text-sm text-foreground">{amostra.ingredientes_adicionais}</p>
                                </div>
                            </div>
                        )}

                        {!amostra.tipo_produto && !amostra.cor && !amostra.textura && !amostra.fragrancia && !amostra.ingredientes_adicionais && (
                            <p className="text-sm text-muted-foreground italic text-center py-4">Sem características especificadas</p>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Observações */}
            {amostra.observacoes && (
                <div className="mt-4 p-4 rounded-xl bg-accent">
                    <h4 className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        Observações
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {amostra.observacoes}
                    </p>
                </div>
            )}
        </div>
    );
}
