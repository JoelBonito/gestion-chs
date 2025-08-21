
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FreteCalculatorProps {
  encomendaId: string;
  itens: Array<{
    produto_id: string;
    quantidade: number;
    peso_produto: number;
  }>;
  onFreteCalculated: (valorFrete: number, pesoTotal: number) => void;
  freteJaCalculado?: boolean;
  valorFreteAtual?: number;
}

export function FreteCalculator({ 
  encomendaId, 
  itens, 
  onFreteCalculated, 
  freteJaCalculado = false,
  valorFreteAtual = 0 
}: FreteCalculatorProps) {
  const [calculando, setCalculando] = useState(false);

  const calcularFrete = async () => {
    setCalculando(true);
    try {
      // Calcular peso total: quantidade × peso de cada item
      const pesoTotal = itens.reduce((total, item) => {
        return total + (item.quantidade * item.peso_produto);
      }, 0);

      // Calcular valor do frete: peso_total × 0.00585 euros por grama
      const valorFrete = pesoTotal * 0.00585;

      console.log(`Peso total: ${pesoTotal}g, Valor frete: €${valorFrete.toFixed(2)}`);

      // Salvar ou atualizar frete na base de dados
      const { data: freteExistente } = await supabase
        .from("frete_encomenda")
        .select("id")
        .eq("encomenda_id", encomendaId)
        .single();

      if (freteExistente) {
        // Atualizar frete existente
        const { error: updateError } = await supabase
          .from("frete_encomenda")
          .update({
            peso_total: pesoTotal,
            valor_frete: valorFrete,
          })
          .eq("encomenda_id", encomendaId);

        if (updateError) throw updateError;
      } else {
        // Criar novo registro de frete
        const { error: insertError } = await supabase
          .from("frete_encomenda")
          .insert([{
            encomenda_id: encomendaId,
            peso_total: pesoTotal,
            valor_frete: valorFrete,
          }]);

        if (insertError) throw insertError;
      }

      // Atualizar campos na encomenda
      const { error: encomendaError } = await supabase
        .from("encomendas")
        .update({
          peso_total: pesoTotal,
          valor_frete: valorFrete,
          frete_calculado: true,
        })
        .eq("id", encomendaId);

      if (encomendaError) throw encomendaError;

      onFreteCalculated(valorFrete, pesoTotal);
      toast.success(`Frete calculado: €${valorFrete.toFixed(2)} (${pesoTotal}g)`);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      toast.error("Erro ao calcular frete");
    } finally {
      setCalculando(false);
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
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Frete já calculado:</p>
            <p className="font-semibold">€{valorFreteAtual.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              Clique em "Calcular Frete" para recalcular com base nos itens atuais
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            O frete será calculado com base no peso total dos itens (€0,00585 por grama)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
