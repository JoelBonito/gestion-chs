import { useState, useEffect, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { Package, Truck, Info, Hash, Tag, User, Store, Calendar as CalendarIcon, Save, Calculator } from "lucide-react";

// Componente de Input com estado local para evitar re-renders do formulário
interface LocalInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  step?: string;
  min?: string;
}

const LocalInput = memo(({ id, value, onChange, placeholder, className, type = "text", step, min }: LocalInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const isFocusedRef = useRef(false);

  // Sincronizar com valor externo apenas quando NÃO está focado
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    onChange(localValue);
  };

  return (
    <Input
      id={id}
      type={type}
      step={step}
      min={min}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
});

LocalInput.displayName = "LocalInput";

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface EncomendaFormProps {
  onSuccess: () => void;
  encomenda?: any;
  initialData?: any;
  isEditing?: boolean;
}

interface FormData {
  numero_encomenda: string;
  etiqueta: string;
  cliente_id: string;
  fornecedor_id: string;
  data_producao_estimada: string;
  data_envio_estimada: string;
  peso_total: number;
  valor_frete: number;
}

// Função auxiliar para calcular peso com margem de 30%
const calcularPesoComEmbalagem = (listaItens: ItemEncomenda[]) => {
  const totalGramas = listaItens.reduce((total, item) => {
    return total + (Number(item.quantidade) * (item.peso_produto || 0));
  }, 0);
  return (totalGramas * 1.30) / 1000; // Retorna em KG
};

export default function EncomendaForm({ onSuccess, encomenda, initialData, isEditing = false }: EncomendaFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pesoBruto, setPesoBruto] = useState(0);

  const editingData = encomenda || initialData;
  const isEdit = isEditing || !!editingData;

  const [formData, setFormData] = useState<FormData>({
    numero_encomenda: "",
    etiqueta: "",
    cliente_id: "",
    fornecedor_id: "",
    data_producao_estimada: "",
    data_envio_estimada: "",
    peso_total: 0,
    valor_frete: 0,
  });

  // Handler simples para atualizar campos
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const pesoKg = calcularPesoComEmbalagem(itens);
    setPesoBruto(pesoKg);
  }, [itens.length]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientesData } = await supabase
        .from("clientes").select("id, nome").eq("active", true).order("nome");
      if (clientesData) setClientes(clientesData);

      const { data: fornecedoresData } = await supabase
        .from("fornecedores").select("id, nome").eq("active", true).order("nome");
      if (fornecedoresData) setFornecedores(fornecedoresData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEdit || !editingData) return;
    if (clientes.length === 0 || fornecedores.length === 0) return;

    setFormData({
      numero_encomenda: editingData.numero_encomenda || "",
      etiqueta: editingData.etiqueta || "",
      cliente_id: editingData.cliente_id || "",
      fornecedor_id: editingData.fornecedor_id || "",
      data_producao_estimada: editingData.data_producao_estimada || "",
      data_envio_estimada: editingData.data_envio_estimada || "",
      peso_total: editingData.peso_total || 0,
      valor_frete: editingData.valor_frete || 0,
    });

    // Carrega itens da encomenda
    const fetchItens = async () => {
      const { data: itensData } = await supabase
        .from("itens_encomenda")
        .select(`*, produtos(nome, marca, tipo, preco_custo, preco_venda, size_weight)`)
        .eq("encomenda_id", editingData.id);
      if (itensData) {
        const itensFormatados = itensData.map((item: any) => ({
          id: item.id,
          tempId: crypto.randomUUID(),
          produto_id: item.produto_id,
          produto_nome: item.produtos ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}` : "Produto não encontrado",
          quantidade: item.quantidade ? `${item.quantidade}` : "",
          preco_custo: item.preco_custo || 0,
          preco_venda: item.preco_unitario,
          subtotal: item.subtotal || (Number(item.quantidade) * item.preco_unitario),
          peso_produto: item.produtos?.size_weight || 0,
        }));
        setItens(itensFormatados);
      }
    };
    fetchItens();
  }, [isEdit, editingData, clientes.length, fornecedores.length]);

  // Ao editar: calcular e preencher Peso Bruto e Valor do Frete
  useEffect(() => {
    if (!isEdit) return;
    if (!itens || itens.length === 0) return;

    const pesoKg = calcularPesoComEmbalagem(itens);
    const tarifaPorKg = 4.5;
    const frete = pesoKg * tarifaPorKg;

    setFormData(prev => ({
      ...prev,
      peso_total: Number(pesoKg.toFixed(2)),
      valor_frete: Number(frete.toFixed(2)),
    }));
  }, [isEdit, itens.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero_encomenda || !formData.cliente_id || !formData.fornecedor_id) {
      toast.error("Número, cliente e fornecedor são obrigatórios.");
      return;
    }

    if (itens.length === 0) {
      toast.error("Adicione pelo menos um item à encomenda.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast.error("Faça login para salvar.");
        setIsSubmitting(false);
        return;
      }

      if (isEdit && editingData?.id) {
        const payloadEncomenda = {
          id: editingData.id,
          numero_encomenda: formData.numero_encomenda,
          etiqueta: formData.etiqueta || null,
          cliente_id: formData.cliente_id,
          fornecedor_id: formData.fornecedor_id,
          data_envio_estimada: formData.data_envio_estimada || null,
          data_producao_estimada: formData.data_producao_estimada || null,
          peso_total: formData.peso_total || 0,
          valor_frete: formData.valor_frete || 0,
        };

        const itensParaSalvar = itens.map(item => ({
          ...(item.id ? { id: item.id } : {}),
          produto_id: item.produto_id,
          quantidade: Math.floor(Number(item.quantidade)) || 0,
          preco_unitario: Number(item.preco_venda) || 0,
          preco_custo: Number(item.preco_custo) || 0,
        }));

        const { error: updateError } = await supabase.rpc('salvar_edicao_encomenda', {
          p_encomenda_id: editingData.id,
          p_dados: payloadEncomenda,
          p_itens: itensParaSalvar
        });
        if (updateError) throw updateError;

        toast.success("Encomenda atualizada!");
      } else {
        const { data: newEncomenda, error } = await supabase
          .from("encomendas")
          .insert([{
            numero_encomenda: formData.numero_encomenda,
            etiqueta: formData.etiqueta || null,
            cliente_id: formData.cliente_id,
            fornecedor_id: formData.fornecedor_id,
            data_producao_estimada: formData.data_producao_estimada || null,
            data_envio_estimada: formData.data_envio_estimada || null,
            valor_total: valorTotal,
            peso_total: formData.peso_total || 0,
            valor_frete: formData.valor_frete || 0,
          }])
          .select();
        if (error) throw error;

        if (newEncomenda && newEncomenda.length > 0) {
          const encomendaId = newEncomenda[0].id;
          const FORNECEDOR_PRODUCAO_ID = 'b8f995d2-47dc-4c8f-9779-ce21431f5244';

          for (const item of itens) {
            await supabase.from("itens_encomenda").insert([{
              encomenda_id: encomendaId,
              produto_id: item.produto_id,
              quantidade: Math.floor(Number(item.quantidade)),
              preco_unitario: item.preco_venda,
              preco_custo: item.preco_custo,
            }]);
          }

          // Deduzir estoque se a encomenda for para o fornecedor de produção
          if (formData.fornecedor_id === FORNECEDOR_PRODUCAO_ID) {
            for (const item of itens) {
              const { data: produto } = await supabase
                .from('produtos')
                .select('fornecedor_id, estoque_garrafas, estoque_tampas, estoque_rotulos')
                .eq('id', item.produto_id)
                .single();

              if (produto?.fornecedor_id === FORNECEDOR_PRODUCAO_ID) {
                const quantidade = Math.floor(Number(item.quantidade));
                const novoEstoqueGarrafas = (produto.estoque_garrafas || 0) - quantidade;
                const novoEstoqueTampas = (produto.estoque_tampas || 0) - quantidade;
                const novoEstoqueRotulos = (produto.estoque_rotulos || 0) - quantidade;

                await supabase
                  .from('produtos')
                  .update({
                    estoque_garrafas: novoEstoqueGarrafas,
                    estoque_tampas: novoEstoqueTampas,
                    estoque_rotulos: novoEstoqueRotulos,
                  })
                  .eq('id', item.produto_id);
              }
            }
          }

          // Enviar notificação por email
          try {
            const clienteNome = clientes.find(c => c.id === formData.cliente_id)?.nome || 'Cliente não encontrado';
            const fornecedorNome = fornecedores.find(f => f.id === formData.fornecedor_id)?.nome || 'Fornecedor não encontrado';
            const produtos = itens.map(item => ({ nome: item.produto_nome, quantidade: Number(item.quantidade) }));

            await sendEmail(
              emailRecipients.geral,
              `📦 Nova encomenda criada — ${formData.numero_encomenda}`,
              emailTemplates.novaEncomenda(formData.numero_encomenda, formData.etiqueta || 'N/A', clienteNome, fornecedorNome, produtos)
            );
          } catch (emailError) {
            console.error("Erro ao enviar email:", emailError);
          }

          toast.success("Encomenda criada!");
        }
      }
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  const gerarNumeroAuto = async () => {
    try {
      const { data, error } = await supabase
        .from("encomendas")
        .select("numero_encomenda")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      let proximoNumero = "ENC001";

      if (data && data.length > 0) {
        const ultimoNumero = data[0].numero_encomenda;
        const match = ultimoNumero.match(/ENC(\d+)/);
        if (match) {
          const numero = parseInt(match[1]) + 1;
          proximoNumero = `ENC${numero.toString().padStart(3, '0')}`;
        }
      }

      handleInputChange("numero_encomenda", proximoNumero);
      toast.success("Número gerado automaticamente!");
    } catch (error) {
      console.error("Erro ao gerar número:", error);
      toast.error("Erro ao gerar número automático");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Principais */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Informações da Encomenda</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numero_encomenda" className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Número da Encomenda *
                </Label>
                <div className="flex gap-2">
                  <LocalInput
                    id="numero_encomenda"
                    placeholder="Ex: ENC001"
                    value={formData.numero_encomenda}
                    onChange={(value) => handleInputChange("numero_encomenda", value)}
                    className="bg-background/50"
                  />
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={gerarNumeroAuto}
                      className="whitespace-nowrap gap-2 bg-secondary/50 border-secondary hover:bg-secondary/70"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      Auto
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="etiqueta" className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Etiqueta
                </Label>
                <LocalInput
                  id="etiqueta"
                  placeholder="Ex: URGENTE"
                  value={formData.etiqueta}
                  onChange={(value) => handleInputChange("etiqueta", value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Cliente *
                </Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => handleInputChange("cliente_id", value)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Fornecedor *
                </Label>
                <Select
                  value={formData.fornecedor_id}
                  onValueChange={(value) => handleInputChange("fornecedor_id", value)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="data_producao" className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Data Produção Estimada
                </Label>
                <Input
                  id="data_producao"
                  type="date"
                  value={formData.data_producao_estimada}
                  onChange={(e) => handleInputChange("data_producao_estimada", e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_envio" className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  Data Envio Estimada
                </Label>
                <Input
                  id="data_envio"
                  type="date"
                  value={formData.data_envio_estimada}
                  onChange={(e) => handleInputChange("data_envio_estimada", e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Seção de Itens */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Produtos da Encomenda</h3>
          </div>

          <ItensEncomendaManager
            itens={itens}
            onItensChange={setItens}
            onValorTotalChange={setValorTotal}
          />
        </GlassCard>

        {/* Seção de Transporte */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4">
            <Truck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Transporte</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="peso_total">Peso Total (kg)</Label>
              <LocalInput
                id="peso_total"
                type="number"
                step="0.01"
                min="0"
                value={String(formData.peso_total || "")}
                onChange={(value) => handleInputChange("peso_total", value ? parseFloat(value) : 0)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Peso bruto calculado: {pesoBruto.toFixed(2)} kg (com margem de 30%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_frete">Valor do Frete (€)</Label>
              <LocalInput
                id="valor_frete"
                type="number"
                step="0.01"
                min="0"
                value={String(formData.valor_frete || "")}
                onChange={(value) => handleInputChange("valor_frete", value ? parseFloat(value) : 0)}
                className="bg-background/50"
              />
            </div>
          </div>
        </GlassCard>

        {/* Resumo */}
        <GlassCard className="p-6 bg-primary/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">Valor Total da Encomenda</p>
              <p className="text-2xl font-bold text-primary">{formatCurrencyEUR(valorTotal)}</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSuccess()}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                className="min-w-[200px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Salvando..."
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? "Atualizar Encomenda" : "Criar Encomenda"}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}