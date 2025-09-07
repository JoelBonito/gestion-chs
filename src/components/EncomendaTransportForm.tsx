
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyEUR } from "@/lib/utils/currency";

const transportSchema = z.object({
  numero_encomenda: z.string(),
  cliente_nome: z.string(),
  fornecedor_nome: z.string(),
  data_producao_estimada: z.string().optional(),
  data_envio_estimada: z.string().optional(),
  observacoes: z.string().optional(),
});

type TransportFormData = z.infer<typeof transportSchema>;

interface EncomendaTransportFormProps {
  encomendaId: string;
  onSuccess: () => void;
}

export function EncomendaTransportForm({ encomendaId, onSuccess }: EncomendaTransportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [pesoParaTransporte, setPesoParaTransporte] = useState(0);

  const form = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
  });

  useEffect(() => {
    const fetchEncomendaData = async () => {
      try {
        // Buscar dados da encomenda
        const { data: encomenda, error: encomendaError } = await supabase
          .from("encomendas")
          .select(`
            *,
            clientes(nome),
            fornecedores(nome)
          `)
          .eq("id", encomendaId)
          .single();

        if (encomendaError) throw encomendaError;

        // Preencher formulário com dados bloqueados
        form.reset({
          numero_encomenda: encomenda.numero_encomenda,
          cliente_nome: encomenda.clientes?.nome || "",
          fornecedor_nome: encomenda.fornecedores?.nome || "",
          data_producao_estimada: encomenda.data_producao_estimada || "",
          data_envio_estimada: encomenda.data_envio_estimada || "",
          observacoes: encomenda.observacoes || "",
        });

        // Buscar itens da encomenda
        const { data: itensData, error: itensError } = await supabase
          .from("itens_encomenda")
          .select(`
            *,
            produtos(nome, marca, tipo, preco_custo, preco_venda, size_weight)
          `)
          .eq("encomenda_id", encomendaId);

        if (itensError) throw itensError;

        if (itensData) {
          const itensFormatados = itensData.map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto_nome: item.produtos ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}` : "",
            quantidade: item.quantidade,
            preco_custo: item.produtos?.preco_custo || 0,
            preco_venda: item.preco_unitario,
            subtotal: item.subtotal,
            peso_produto: item.produtos?.size_weight || 0,
          }));
          setItens(itensFormatados);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da encomenda:", error);
        toast.error("Erro ao carregar dados da encomenda");
      }
    };

    fetchEncomendaData();
  }, [encomendaId, form]);

  // Calcular peso para transporte sempre que os itens mudarem
  useEffect(() => {
    const pesoTotalGramas = itens.reduce((total, item) => {
      return total + (item.quantidade * (item.peso_produto || 0));
    }, 0);
    
    const pesoTotalKg = pesoTotalGramas / 1000;
    const pesoComFator = pesoTotalKg * 1.30;
    setPesoParaTransporte(pesoComFator);
  }, [itens]);

  const onSubmit = async (data: TransportFormData) => {
    setIsSubmitting(true);
    try {
      // Atualizar encomenda com novas datas e observações
      const { error: encomendaError } = await supabase
        .from("encomendas")
        .update({
          data_producao_estimada: data.data_producao_estimada || null,
          data_envio_estimada: data.data_envio_estimada || null,
          observacoes: data.observacoes || null,
        })
        .eq("id", encomendaId);

      if (encomendaError) throw encomendaError;

      // Atualizar itens com quantidades finais
      for (const item of itens) {
        if (item.id) {
          const { error: itemError } = await supabase
            .from("itens_encomenda")
            .update({
              quantidade: item.quantidade,
              preco_unitario: item.preco_venda,
            })
            .eq("id", item.id);

          if (itemError) throw itemError;
        }
      }

      toast.success("Encomenda atualizada para transporte!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar encomenda:", error);
      toast.error("Erro ao atualizar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajustar Encomenda para Transporte</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="numero_encomenda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Encomenda</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cliente_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fornecedor_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="data_producao_estimada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Produção Estimada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_envio_estimada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Envio Estimada</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campo Peso para Transporte */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h4 className="font-semibold text-blue-700 mb-2">Peso para Transporte</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {pesoParaTransporte.toFixed(2)} kg
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      (Peso dos itens × 1,30)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <ItensEncomendaManager
                itens={itens}
                onItensChange={setItens}
                onValorTotalChange={setValorTotal}
                isTransportMode={true}
              />

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor Total:</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrencyEUR(valorTotal)}
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a encomenda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
