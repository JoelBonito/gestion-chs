import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
// Interface local simplificada para evitar problemas de importação
interface Cliente {
  id: string;
  nome: string;
  active?: boolean;
}

interface Fornecedor {
  id: string;
  nome: string;
  active?: boolean;
}
import { GlassCard } from "@/components/GlassCard";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { Package, Truck, Info, Hash, Tag, User, Store, Calendar as CalendarIcon, Save, Calculator, Euro } from "lucide-react";

// Componente de Input com estado local para evitar re-renders do formulário
interface LocalInputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const LocalInput = memo(({ value, onChange, type = "text", step, min, placeholder, disabled, className, id }: LocalInputProps) => {
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(String(value ?? ""));
    }
  }, [value]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
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
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
});

LocalInput.displayName = "LocalInput";

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

const calcularPesoComEmbalagem = (listaItens: ItemEncomenda[]) => {
  const totalGramas = listaItens.reduce((total, item) => {
    return total + (Number(item.quantidade) * (item.peso_produto || 0));
  }, 0);
  return (totalGramas * 1.30) / 1000;
};

export default function EncomendaForm({ onSuccess, encomenda, initialData, isEditing = false }: EncomendaFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flag para prevenir sobrescrita durante carregamento
  const isInitializing = useRef(true);

  const pesoBruto = useMemo(() => calcularPesoComEmbalagem(itens), [itens]);

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

  // Atualizar peso/frete APENAS após inicialização
  useEffect(() => {
    if (isInitializing.current) return;

    const freteCalculado = pesoBruto * 4.5;
    setFormData(prev => ({
      ...prev,
      peso_total: pesoBruto,
      valor_frete: freteCalculado
    }));
  }, [pesoBruto]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch clientes e fornecedores
  useEffect(() => {
    const fetchData = async () => {
      const { data: clientesData } = await supabase
        .from("clientes").select("id, nome, active").eq("active", true).order("nome");
      if (clientesData) setClientes(clientesData as any);

      const { data: fornecedoresData } = await supabase
        .from("fornecedores").select("id, nome, active").eq("active", true).order("nome");
      if (fornecedoresData) setFornecedores(fornecedoresData as any);
    };
    fetchData();
  }, []);

  // Carregar dados de edição ou gerar número para nova encomenda
  useEffect(() => {
    const editingData = encomenda || initialData;
    const isEdit = isEditing || !!editingData;

    if (editingData) {
      isInitializing.current = true;

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

      // Se itens não vieram no objeto, buscar do banco
      const loadItens = async () => {

        let itensData = editingData.itens;

        if (!itensData && editingData.id) {

          const { data: itensFromDb, error } = await supabase
            .from("itens_encomenda")
            .select(`
              *,
              produtos:produto_id (
                nome,
                marca,
                tipo,
                size_weight
              )
            `)
            .eq("encomenda_id", editingData.id);


          if (error) {
          }

          if (itensFromDb) {
            itensData = itensFromDb.map((item: any) => ({
              ...item,
              produto_nome: item.produtos?.nome || "",
              peso_produto: item.produtos?.size_weight || 0,
              preco_venda: item.preco_unitario || 0,
            }));
          }
        } else {
        }

        const initialItens = (itensData || []).map((item: any) => ({
          ...item,
          tempId: crypto.randomUUID(),
          quantidade: String(item.quantidade || 0),
          preco_custo: Number(item.preco_custo || 0),
          preco_venda: Number(item.preco_venda || item.preco_unitario || 0),
          peso_produto: Number(item.peso_produto || item.produtos?.size_weight || 0),
          produto_nome: item.produto_nome || item.produtos?.nome || "",
        }));


        setItens(initialItens);

        const total = initialItens.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0);
        setValorTotal(total);


        // Se frete está zerado, calcular automaticamente
        if ((editingData.valor_frete || 0) === 0 && initialItens.length > 0) {
          const pesoCalculado = calcularPesoComEmbalagem(initialItens);
          const freteCalculado = pesoCalculado * 4.5;
          setFormData(prev => ({
            ...prev,
            peso_total: pesoCalculado,
            valor_frete: freteCalculado
          }));
        }

        setTimeout(() => {
          isInitializing.current = false;
        }, 100);
      };

      loadItens();
    } else {
      const fetchLastNumber = async () => {
        const { data } = await supabase
          .from("encomendas")
          .select("numero_encomenda")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (data?.numero_encomenda) {
          const lastNum = parseInt(data.numero_encomenda.replace(/\D/g, ""));
          const nextNum = `ENC${String(lastNum + 1).padStart(3, "0")}`;
          handleInputChange("numero_encomenda", nextNum);
        } else {
          handleInputChange("numero_encomenda", "ENC001");
        }

        isInitializing.current = false;
      };

      if (!isEdit) fetchLastNumber();
    }
  }, [encomenda, initialData, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações obrigatórias
      if (itens.length === 0) {
        alert("Adicione pelo menos um produto.");
        setIsSubmitting(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Para UPDATE: não enviar user_id (não existe na tabela)
      // Para CREATE: created_by é preenchido automaticamente via default auth.uid()
      const encomendaData = {
        ...formData,
        peso_total: pesoBruto,
        // Converter strings vazias em null para datas
        data_producao_estimada: formData.data_producao_estimada || null,
        data_envio_estimada: formData.data_envio_estimada || null,
      };

      let encomendaId = encomenda?.id;
      const isEdit = isEditing || !!encomendaId;

      if (isEdit && encomendaId) {

        const { error } = await supabase
          .from("encomendas")
          .update(encomendaData)
          .eq("id", encomendaId);

        if (error) {
          throw error;
        }


        await supabase.from("itens_encomenda").delete().eq("encomenda_id", encomendaId);

        const itensToInsert = itens.map(item => ({
          encomenda_id: encomendaId,
          produto_id: item.produto_id,
          quantidade: parseInt(item.quantidade) || 0,
          preco_custo: item.preco_custo,
          preco_unitario: item.preco_venda
        }));

        if (itensToInsert.length > 0) {
          const { error: itemsError } = await supabase.from("itens_encomenda").insert(itensToInsert);
          if (itemsError) throw itemsError;
        }
      } else {
        const { data: newEncomenda, error } = await supabase
          .from("encomendas")
          .insert([encomendaData])
          .select()
          .single();

        if (error) throw error;
        encomendaId = newEncomenda.id;

        const itensToInsert = itens.map(item => ({
          encomenda_id: encomendaId,
          produto_id: item.produto_id,
          quantidade: parseInt(item.quantidade) || 0,
          preco_custo: item.preco_custo,
          preco_unitario: item.preco_venda
        }));

        if (itensToInsert.length > 0) {
          const { error: itemsError } = await supabase.from("itens_encomenda").insert(itensToInsert);
          if (itemsError) throw itemsError;
        }

        try {
          await sendEmail(
            emailRecipients.geral,
            "Nova Encomenda",
            emailTemplates.novaEncomenda(
              formData.numero_encomenda,
              formData.etiqueta,
              clientes.find(c => c.id === formData.cliente_id)?.nome || "Cliente",
              fornecedores.find(f => f.id === formData.fornecedor_id)?.nome || "Fornecedor",
              itens.map(i => ({ nome: i.produto_nome || "Produto", quantidade: Number(i.quantidade) }))
            )
          );
        } catch (emailError) {
          console.error("Erro ao enviar email:", emailError);
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar encomenda. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-6">

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
                    value={formData.numero_encomenda}
                    onChange={(value) => handleInputChange("numero_encomenda", value)}
                    className="bg-background/50 font-mono flex-1"
                    placeholder="ENC..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { data } = await supabase
                        .from("encomendas")
                        .select("numero_encomenda")
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single();

                      if (data?.numero_encomenda) {
                        const lastNum = parseInt(data.numero_encomenda.replace(/\D/g, ""));
                        const nextNum = `ENC${String(lastNum + 1).padStart(3, "0")}`;
                        handleInputChange("numero_encomenda", nextNum);
                      } else {
                        handleInputChange("numero_encomenda", "ENC001");
                      }
                    }}
                    className="shrink-0"
                  >
                    AUTO
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="etiqueta" className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Etiqueta
                </Label>
                <LocalInput
                  id="etiqueta"
                  value={formData.etiqueta}
                  onChange={(value) => handleInputChange("etiqueta", value)}
                  className="bg-background/50"
                  placeholder="Ex: Urgente, Promoção..."
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
                  Data Entrega Estimada
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  Peso Bruto Estimado
                </Label>
                <div className="p-2 bg-muted/30 rounded border border-border/50 text-sm h-10 flex items-center">
                  {pesoBruto.toFixed(2)} kg
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_frete" className="flex items-center gap-2">
                  <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                  Valor do Frete (€)
                </Label>
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
          </div>
        </GlassCard>

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
                className="bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Encomenda
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </form>
  );
}