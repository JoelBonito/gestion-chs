import { Eye, Calendar, Package, FileText, User, Droplets, Palette, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared";
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
      <div className="bg-popover border-border/20 hover:border-primary/50 flex flex-col items-start gap-4 rounded-xl border p-4 transition-all duration-300 sm:flex-row sm:items-center">
        <div className="bg-primary/10 text-primary rounded-full p-4">
          <Package className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-xl font-bold">{amostra.referencia}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {new Date(amostra.data).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Informações Principais */}
        <div className="flex h-full flex-col space-y-4">
          <h3 className="text-muted-foreground flex items-center gap-2 px-1 text-sm font-semibold tracking-wider uppercase">
            <FileText className="text-primary h-4 w-4" />
            Informações Principais
          </h3>

          <GlassCard className="bg-popover flex-1 space-y-4 border-none p-4 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="bg-nav-dashboard/10 text-nav-dashboard shrink-0 rounded-full p-2">
                <User className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">Cliente</p>
                <p className="text-foreground text-sm">
                  {amostra.clientes?.nome || amostra.nome || "—"}
                </p>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary shrink-0 rounded-full p-2">
                <Package className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">Projeto</p>
                <p className="text-foreground text-sm">{amostra.projeto || "—"}</p>
              </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-full bg-emerald-500/10 p-2 text-emerald-500">
                <Package className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-medium uppercase">
                  Quantidade
                </p>
                <p className="text-foreground text-sm font-bold">
                  {amostra.quantidade_amostras} amostras
                </p>
              </div>
            </div>

            {amostra.data_envio && (
              <>
                <Separator className="bg-border/40" />
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-full bg-cyan-500/10 p-2 text-cyan-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-[10px] font-medium uppercase">
                      Data de Envio
                    </p>
                    <p className="text-foreground text-sm">
                      {new Date(amostra.data_envio).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        </div>

        {/* Características */}
        <div className="flex h-full flex-col space-y-4">
          <h3 className="text-muted-foreground flex items-center gap-2 px-1 text-sm font-semibold tracking-wider uppercase">
            <Sparkles className="text-primary h-4 w-4" />
            Características
          </h3>

          <GlassCard className="bg-popover flex-1 space-y-4 border-none p-4 shadow-inner">
            {amostra.tipo_produto && (
              <>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-full bg-purple-500/10 p-2 text-purple-500">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-[10px] font-medium uppercase">
                      Tipo de Produto
                    </p>
                    <p className="text-foreground text-sm">{amostra.tipo_produto}</p>
                  </div>
                </div>
                <Separator className="bg-border/40" />
              </>
            )}

            {amostra.cor && (
              <>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-full bg-pink-500/10 p-2 text-pink-500">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-[10px] font-medium uppercase">Cor</p>
                    <p className="text-foreground text-sm">{amostra.cor}</p>
                  </div>
                </div>
                <Separator className="bg-border/40" />
              </>
            )}

            {amostra.textura && (
              <>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-full bg-amber-500/10 p-2 text-amber-500">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-[10px] font-medium uppercase">
                      Textura
                    </p>
                    <p className="text-foreground text-sm">{amostra.textura}</p>
                  </div>
                </div>
                <Separator className="bg-border/40" />
              </>
            )}

            {amostra.fragrancia && (
              <>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-full bg-blue-500/10 p-2 text-blue-500">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-[10px] font-medium uppercase">
                      Fragrância
                    </p>
                    <p className="text-foreground text-sm">{amostra.fragrancia}</p>
                  </div>
                </div>
                <Separator className="bg-border/40" />
              </>
            )}

            {amostra.ingredientes_adicionais && (
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-full bg-green-500/10 p-2 text-green-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-[10px] font-medium uppercase">
                    Ingredientes Adicionais
                  </p>
                  <p className="text-foreground text-sm">{amostra.ingredientes_adicionais}</p>
                </div>
              </div>
            )}

            {!amostra.tipo_produto &&
              !amostra.cor &&
              !amostra.textura &&
              !amostra.fragrancia &&
              !amostra.ingredientes_adicionais && (
                <p className="text-muted-foreground py-4 text-center text-sm italic">
                  Sem características especificadas
                </p>
              )}
          </GlassCard>
        </div>
      </div>

      {/* Observações */}
      {amostra.observacoes && (
        <div className="bg-accent mt-4 rounded-xl p-4">
          <h4 className="text-primary mb-2 flex items-center gap-2 text-xs font-bold uppercase">
            <FileText className="h-3.5 w-3.5" />
            Observações
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
            {amostra.observacoes}
          </p>
        </div>
      )}
    </div>
  );
}
