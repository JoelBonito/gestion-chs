
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FreteCalculatorProps {
  encomendaId: string;
  itens: Array<{
    produto_id: string;
    quantidade: number;
    peso_produto: number;
  }>;
  onFreteAdded: () => void;
  freteJaCalculado?: boolean;
  valorFreteAtual?: number;
  pesoTotalAtual?: number;
}

export function FreteCalculator({ 
  encomendaId, 
  itens, 
  onFreteAdded,
  freteJaCalculado = false,
  valorFreteAtual = 0,
  pesoTotalAtual = 0
}: FreteCalculatorProps) {
  const [calculando, setCalculando] = useState(false);
  const [adicionandoFrete, setAdicionandoFrete] = useState(false);
  const [pesoTotalGramas, setPesoTotalGramas] = useState(0);
  const [pesoTotalKg, setPesoTotalKg] = useState(0);
  const [valorFrete, setValorFrete] = useState(0);
  const [freteCalculado, setFreteCalculado] = useState(false);

  const calcularFrete = async () => {
    setCalculando(true);
    try {
      // Calcular peso total: quantidade × peso de cada item (em gramas)
      const pesoTotalEmGramas = itens.reduce((total, item) => {
        return total + (item.quantidade * item.peso_produto);
      }, 0);

      // Converter gramas para quilos (1000g = 1kg)
      const pesoTotalEmKg = pesoTotalEmGramas / 1000;

      // Calcular valor do frete: peso_total_kg × 5.85 euros por kg
      const valorFreteCalculado = pesoTotalEmKg * 5.85;

      setPesoTotalGramas(pesoTotalEmGramas);
      setPesoTotalKg(pesoTotalEmKg);
      setValorFrete(valorFreteCalculado);
      setFreteCalculado(true);

      console.log(`Peso total: ${pesoTotalEmGramas}g (${pesoTotalEmKg}kg), Valor frete: €${valorFreteCalculado.toFixed(2)}`);

      toast.success(`Frete calculado: €${valorFreteCalculado.toFixed(2)} para ${pesoTotalEmKg.toFixed(2)}kg`);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      toast.error("Erro ao calcular frete");
    } finally {
      setCalculando(false);
    }
  };

  const adicionarFreteNaEncomenda = async () => {
    setAdicionandoFrete(true);
    try {
      // Primeiro, verificar se já existe um item de frete na encomenda
      const { data: itemFreteExistente } = await supabase
        .from("itens_encomenda")
        .select("id")
        .eq("encomenda_id", encomendaId)
        .eq("produto_id", "00000000-0000-0000-0000-000000000001") // ID especial para frete
        .single();

      if (itemFreteExistente) {
        // Atualizar item de frete existente
        const { error: updateError } = await supabase
          .from("itens_encomenda")
          .update({
            quantidade: pesoTotalKg,
            preco_unitario: 5.85,
            subtotal: valorFrete,
          })
          .eq("id", itemFreteExistente.id);

        if (updateError) throw updateError;
      } else {
        // Criar produto especial para frete se não existir
        const { data: produtoFrete } = await supabase
          .from("produtos")
          .select("id")
          .eq("id", "00000000-0000-0000-0000-000000000001")
          .single();

        if (!produtoFrete) {
          const { error: produtoError } = await supabase
            .from("produtos")
            .insert([{
              id: "00000000-0000-0000-0000-000000000001",
              nome: "FRETE SÃO PAULO - MARSELHA",
              marca: "TRANSPORTE",
              tipo: "FRETE",
              preco_custo: 5.85,
              preco_venda: 5.85,
              size_weight: 1000, // 1kg em gramas
              ativo: false // Não listado como produto normal
            }]);

          if (produtoError) throw produtoError;
        }

        // Adicionar novo item de frete
        const { error: insertError } = await supabase
          .from("itens_encomenda")
          .insert([{
            encomenda_id: encomendaId,
            produto_id: "00000000-0000-0000-0000-000000000001",
            quantidade: pesoTotalKg,
            preco_unitario: 5.85,
            subtotal: valorFrete,
          }]);

        if (insertError) throw insertError;
      }

      // Atualizar campos na encomenda
      const { error: encomendaError } = await supabase
        .from("encomendas")
        .update({
          peso_total: pesoTotalGramas,
          valor_frete: valorFrete,
          frete_calculado: true,
        })
        .eq("id", encomendaId);

      if (encomendaError) throw encomendaError;

      onFreteAdded();
      toast.success(`Frete adicionado: €${valorFrete.toFixed(2)} (${pesoTotalKg.toFixed(2)}kg)`);
      setFreteCalculado(false);
    } catch (error) {
      console.error("Erro ao adicionar frete:", error);
      toast.error("Erro ao adicionar frete à encomenda");
    } finally {
      setAdicionandoFrete(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cálculo de Frete
          <Button 
            onClick={calcularFrete} 
            disabled={calculando || itens.length === 0}
            variant="outline"
            size="sm"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {calculando ? "Calculando..." : "Calcular Frete"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {freteJaCalculado ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Frete já calculado:</p>
              <p className="font-semibold">€{valorFreteAtual.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Peso total: {(pesoTotalAtual / 1000).toFixed(2)}kg
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Clique em "Calcular Frete" para recalcular com base nos itens atuais
            </p>
          </div>
        ) : freteCalculado ? (
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Resultado do Cálculo</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Peso total:</span> {pesoTotalGramas}g ({pesoTotalKg.toFixed(2)}kg)
                </p>
                <p className="text-sm">
                  <span className="font-medium">Valor por kg:</span> €5,85
                </p>
                <p className="text-lg font-bold text-primary">
                  <span className="font-medium">Valor do frete:</span> €{valorFrete.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              onClick={adicionarFreteNaEncomenda}
              disabled={adicionandoFrete}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {adicionandoFrete ? "Adicionando..." : "Adicionar Frete na Encomenda"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            O frete será calculado com base no peso total dos itens (€5,85 por kg)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
