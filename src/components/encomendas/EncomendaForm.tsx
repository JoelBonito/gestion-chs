import { useState, useEffect, useRef, memo, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ItensEncomendaManager, type ItemEncomenda } from "./ItensEncomendaManager";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import { sendEmail, emailTemplates, emailRecipients } from "@/lib/email";
import { PushNotifications } from "@/lib/push-notifications";
import {
  Package,
  Truck,
  Info,
  Hash,
  Tag,
  User,
  Store,
  Calendar as CalendarIcon,
  Save,
  Calculator,
  Euro,
  X,
  Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// ============================================
// PALETA DE CORES OFICIAL DO WEB APP
// ============================================
// Fundo Modal: #0f1116
// Fundo Cards/Seções: #1C202A
// Bordas: border-border (tokens do tema)
// Texto Principal: #FFFFFF
// Texto Secundário: #9CA3AF
// Botão Salvar: variant="gradient" (Gradiente #5FCFCF → #3D7A8C)
// ============================================

const SectionStyles =
  "bg-card border border-border rounded-xl p-5 mb-4 hover:border-primary/50 transition-all duration-300";
const LabelStyles =
  "text-xs font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-2";
const InputStyles =
  "bg-popover border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20";

// Interface local
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

// LocalInput com estado local
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
  inputMode?: "numeric" | "decimal" | "text";
}

const LocalInput = memo(
  ({
    value,
    onChange,
    type = "text",
    step,
    min,
    placeholder,
    disabled,
    className,
    id,
    inputMode,
  }: LocalInputProps) => {
    const [localValue, setLocalValue] = useState(String(value ?? ""));
    const isFocusedRef = useRef(false);

    useEffect(() => {
      if (!isFocusedRef.current) {
        if (inputMode === "decimal" && value !== undefined && value !== null && value !== "") {
          const val = Number(value);
          setLocalValue(
            val.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          );
        } else {
          setLocalValue(String(value ?? ""));
        }
      }
    }, [value, inputMode]);

    return (
      <Input
        id={id}
        type={type}
        step={step}
        min={min}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          if (inputMode === "decimal" && localValue) {
            const normalized = localValue.replace(/\./g, "").replace(",", ".");
            const num = parseFloat(normalized);
            if (!isNaN(num)) {
              setLocalValue(
                num.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              );
              onChange(String(num));
              return;
            }
          }
          onChange(localValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            isFocusedRef.current = false;
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        inputMode={inputMode}
        className={cn(InputStyles, className)}
        disabled={disabled}
      />
    );
  }
);
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
  const totalGramas = listaItens.reduce(
    (total, item) => total + Number(item.quantidade) * (item.peso_produto || 0),
    0
  );
  return (totalGramas * 1.3) / 1000;
};

export default function EncomendaForm({
  onSuccess,
  encomenda,
  initialData,
  isEditing = false,
}: EncomendaFormProps) {
  // Dados iniciais da encomenda (para edição)
  const editingData = encomenda || initialData;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInitializing = useRef(true);
  const pesoBruto = useMemo(() => calcularPesoComEmbalagem(itens), [itens]);

  // Estados para controlar fechamento automático dos calendários
  const [producaoCalendarOpen, setProducaoCalendarOpen] = useState(false);
  const [envioCalendarOpen, setEnvioCalendarOpen] = useState(false);

  // Inicializar formData com dados da encomenda quando disponível
  const [formData, setFormData] = useState<FormData>(() => ({
    numero_encomenda: editingData?.numero_encomenda || "",
    etiqueta: editingData?.etiqueta || "",
    cliente_id: editingData?.cliente_id || "",
    fornecedor_id: editingData?.fornecedor_id || "",
    data_producao_estimada: editingData?.data_producao_estimada || "",
    data_envio_estimada: editingData?.data_envio_estimada || "",
    peso_total: editingData?.peso_total || 0,
    valor_frete: editingData?.valor_frete || 0,
  }));

  useEffect(() => {
    if (isInitializing.current) return;
    const freteCalculado = pesoBruto * 4.5;
    setFormData((prev) => ({ ...prev, peso_total: pesoBruto, valor_frete: freteCalculado }));
  }, [pesoBruto]);

  const handleInputChange = (field: keyof FormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Carregar clientes e fornecedores - incluindo os da encomenda atual se estiver editando
  useEffect(() => {
    const fetchData = async () => {
      const editingData = encomenda || initialData;

      // Executa buscas em paralelo
      const [clientesRes, fornecedoresRes] = await Promise.all([
        supabase.from("clientes").select("id, nome, active").eq("active", true).order("nome"),
        supabase.from("fornecedores").select("id, nome, active").eq("active", true).order("nome"),
      ]);

      let allClientes = (clientesRes.data || []) as Cliente[];
      let allFornecedores = (fornecedoresRes.data || []) as Fornecedor[];

      // Complementa com dados da encomenda se necessário (em paralelo também se ambos precisarem)
      const extraFetches = [];

      if (editingData?.cliente_id && !allClientes.some((c) => c.id === editingData.cliente_id)) {
        extraFetches.push(
          supabase
            .from("clientes")
            .select("id, nome, active")
            .eq("id", editingData.cliente_id)
            .single()
        );
      }
      if (
        editingData?.fornecedor_id &&
        !allFornecedores.some((f) => f.id === editingData.fornecedor_id)
      ) {
        extraFetches.push(
          supabase
            .from("fornecedores")
            .select("id, nome, active")
            .eq("id", editingData.fornecedor_id)
            .single()
        );
      }

      if (extraFetches.length > 0) {
        const extraRes = await Promise.all(extraFetches);
        extraRes.forEach((res) => {
          if (res.data) {
            if ("nome" in res.data) {
              // Type check simples
              const clientOrSupp = res.data as any;
              // Verifica se é cliente ou fornecedor pelo campo de retorno original se necessário,
              // mas como sabemos a ordem pelo push, podemos ser diretos:
              if (editingData?.cliente_id === clientOrSupp.id)
                allClientes = [clientOrSupp, ...allClientes];
              else allFornecedores = [clientOrSupp, ...allFornecedores];
            }
          }
        });
      }

      setClientes(allClientes);
      setFornecedores(allFornecedores);
    };
    fetchData();
  }, [encomenda, initialData]);

  // Carregar itens da encomenda quando editando
  useEffect(() => {
    if (editingData) {
      isInitializing.current = true;

      const loadItens = async () => {
        let itensData = (editingData as any).itens;
        if (!itensData && editingData.id) {
          const { data: itensFromDb } = await supabase
            .from("itens_encomenda")
            .select(`*, produtos:produto_id (nome, marca, tipo, size_weight)`)
            .eq("encomenda_id", editingData.id);
          if (itensFromDb)
            itensData = itensFromDb.map((item: any) => ({
              ...item,
              produto_nome: item.produtos?.nome || "",
              peso_produto: item.produtos?.size_weight || 0,
              preco_venda: item.preco_unitario || 0,
            }));
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
        setValorTotal(
          initialItens.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0)
        );
        if ((editingData.valor_frete || 0) === 0 && initialItens.length > 0) {
          const pesoCalculado = calcularPesoComEmbalagem(initialItens);
          setFormData((prev) => ({
            ...prev,
            peso_total: pesoCalculado,
            valor_frete: pesoCalculado * 4.5,
          }));
        }
        setTimeout(() => {
          isInitializing.current = false;
        }, 100);
      };
      loadItens();
    } else {
      // Nova encomenda - buscar próximo número
      const fetchLastNumber = async () => {
        const { data } = await supabase
          .from("encomendas")
          .select("numero_encomenda")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (data?.numero_encomenda) {
          const lastNum = parseInt(data.numero_encomenda.replace(/\D/g, ""));
          handleInputChange("numero_encomenda", `ENC${String(lastNum + 1).padStart(3, "0")}`);
        } else {
          handleInputChange("numero_encomenda", "ENC001");
        }
        isInitializing.current = false;
      };
      fetchLastNumber();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validações
      if (!formData.cliente_id) {
        toast.error("Selecione um cliente.");
        setIsSubmitting(false);
        return;
      }
      if (!formData.fornecedor_id) {
        toast.error("Selecione um fornecedor.");
        setIsSubmitting(false);
        return;
      }
      if (itens.length === 0) {
        toast.error("Adicione pelo menos um produto.");
        setIsSubmitting(false);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Preparar apenas os campos que existem na tabela encomendas
      const encomendaData = {
        numero_encomenda: formData.numero_encomenda,
        etiqueta: formData.etiqueta || null,
        cliente_id: formData.cliente_id,
        fornecedor_id: formData.fornecedor_id,
        // Garantir que datas vazias sejam enviadas como null
        data_producao_estimada: formData.data_producao_estimada
          ? formData.data_producao_estimada
          : null,
        data_envio_estimada: formData.data_envio_estimada ? formData.data_envio_estimada : null,
        // Garantir que números sejam enviados como números
        peso_total: Number(pesoBruto) || 0,
        valor_frete: Number(formData.valor_frete) || 0,
        valor_total: Number(valorTotal) || 0,
        valor_pago: 0,
        // Adicionar status explicitamente (será removido no update)
        status: "NOVO PEDIDO" as any,
      };

      let encomendaId = encomenda?.id;
      const isEdit = isEditing || !!encomendaId;

      if (isEdit && encomendaId) {
        // REMOVER status do payload de update para não disparar trigger de mudança de status
        // A edição deste form não deve alterar o status do pedido
        const { status, ...updateData } = encomendaData;

        const { error } = await supabase
          .from("encomendas")
          .update(updateData)
          .eq("id", encomendaId);
        if (error) throw error;

        await supabase.from("itens_encomenda").delete().eq("encomenda_id", encomendaId);
        const itensToInsert = itens.map((item) => ({
          encomenda_id: encomendaId,
          produto_id: item.produto_id,
          quantidade: parseInt(item.quantidade) || 0,
          preco_custo: item.preco_custo,
          preco_unitario: item.preco_venda,
        }));
        if (itensToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from("itens_encomenda")
            .insert(itensToInsert);
          if (itemsError) throw itemsError;
        }
        toast.success("Encomenda atualizada!");
      } else {
        const { data: newEncomenda, error } = await supabase
          .from("encomendas")
          .insert(encomendaData)
          .select()
          .single();
        if (error) throw error;
        encomendaId = newEncomenda.id;
        const itensToInsert = itens.map((item) => ({
          encomenda_id: encomendaId,
          produto_id: item.produto_id,
          quantidade: parseInt(item.quantidade) || 0,
          preco_custo: item.preco_custo,
          preco_unitario: item.preco_venda,
        }));
        if (itensToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from("itens_encomenda")
            .insert(itensToInsert);
          if (itemsError) throw itemsError;
        }
        try {
          await sendEmail(
            emailRecipients.geral,
            "Nova Encomenda",
            emailTemplates.novaEncomenda(
              formData.numero_encomenda,
              formData.etiqueta,
              clientes.find((c) => c.id === formData.cliente_id)?.nome || "Cliente",
              fornecedores.find((f) => f.id === formData.fornecedor_id)?.nome || "Fornecedor",
              itens.map((i) => ({
                nome: i.produto_nome || "Produto",
                quantidade: Number(i.quantidade),
              }))
            )
          );
        } catch { }
        // Enviar push notification
        PushNotifications.novaEncomenda(formData.numero_encomenda).catch(() => { });
        toast.success("Encomenda criada!");
      }
      onSuccess();
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao salvar encomenda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seção: Informações */}
      <div className={SectionStyles}>
        <div className="border-border/30 mb-4 flex items-center gap-2 border-b pb-3">
          <Info className="text-primary h-4 w-4" />
          <h3 className="text-sm font-semibold text-foreground">
            Informações da Encomenda
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <Hash className="h-3 w-3" /> Número *
              </Label>
              <div className="flex gap-2">
                <LocalInput
                  id="numero_encomenda"
                  value={formData.numero_encomenda}
                  onChange={(v) => handleInputChange("numero_encomenda", v)}
                  className="flex-1 font-mono"
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
                      handleInputChange(
                        "numero_encomenda",
                        `ENC${String(parseInt(data.numero_encomenda.replace(/\D/g, "")) + 1).padStart(3, "0")}`
                      );
                    } else {
                      handleInputChange("numero_encomenda", "ENC001");
                    }
                  }}
                  className="shrink-0 border-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                >
                  AUTO
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <Tag className="h-3 w-3" /> Etiqueta
              </Label>
              <LocalInput
                id="etiqueta"
                value={formData.etiqueta}
                onChange={(v) => handleInputChange("etiqueta", v)}
                className="font-bold uppercase"
                placeholder="URGENTE..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <User className="h-3 w-3" /> Cliente *
              </Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(v) => handleInputChange("cliente_id", v)}
              >
                <SelectTrigger className={InputStyles}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  {clientes.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                    >
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <Store className="h-3 w-3" /> Fornecedor *
              </Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={(v) => handleInputChange("fornecedor_id", v)}
              >
                <SelectTrigger className={InputStyles}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  {fornecedores.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={f.id}
                      className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                    >
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <CalendarIcon className="h-3 w-3" /> Produção Estimada
              </Label>
              <Popover open={producaoCalendarOpen} onOpenChange={setProducaoCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      InputStyles,
                      "w-full justify-between font-bold",
                      !formData.data_producao_estimada && "text-muted-foreground"
                    )}
                  >
                    {formData.data_producao_estimada
                      ? format(parseISO(formData.data_producao_estimada), "dd/MM/yyyy")
                      : "Selecionar..."}
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-card border-border w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={
                      formData.data_producao_estimada
                        ? parseISO(formData.data_producao_estimada)
                        : undefined
                    }
                    onSelect={(d) => {
                      handleInputChange("data_producao_estimada", d ? format(d, "yyyy-MM-dd") : "");
                      setProducaoCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <Truck className="h-3 w-3" /> Envio Estimado
              </Label>
              <Popover open={envioCalendarOpen} onOpenChange={setEnvioCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      InputStyles,
                      "w-full justify-between font-bold",
                      !formData.data_envio_estimada && "text-muted-foreground"
                    )}
                  >
                    {formData.data_envio_estimada
                      ? format(parseISO(formData.data_envio_estimada), "dd/MM/yyyy")
                      : "Selecionar..."}
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-card border-border w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={
                      formData.data_envio_estimada
                        ? parseISO(formData.data_envio_estimada)
                        : undefined
                    }
                    onSelect={(d) => {
                      handleInputChange("data_envio_estimada", d ? format(d, "yyyy-MM-dd") : "");
                      setEnvioCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <Calculator className="h-3 w-3" /> Peso Bruto
              </Label>
              <div className="bg-accent border-border text-primary flex h-10 items-center rounded-lg border px-3 font-bold shadow-sm">
                {pesoBruto.toFixed(2)} kg
              </div>
            </div>
            <div className="space-y-2">
              <Label className={LabelStyles}>
                <Euro className="h-3 w-3" /> Frete (€)
              </Label>
              <LocalInput
                id="valor_frete"
                type="text"
                inputMode="decimal"
                value={String(formData.valor_frete || "")}
                onChange={(v) =>
                  handleInputChange("valor_frete", v ? parseFloat(v.replace(",", ".")) : 0)
                }
                className="text-primary font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Itens da Encomenda */}
      <div className="mb-4">
        <ItensEncomendaManager
          itens={itens}
          onItensChange={setItens}
          onValorTotalChange={setValorTotal}
          onCancel={onSuccess}
          isSubmitting={isSubmitting}
        />
      </div>
    </form>
  );
}
