import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ItensEncomendaManager, ItemEncomenda } from "@/components/ItensEncomendaManager";

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

interface EncomendaFormData {
  numero_encomenda: string;
  cliente_id: string;
  fornecedor_id: string;
  data_producao_estimada?: Date;
  data_envio_estimada?: Date;
  observacoes?: string;
  referencia?: string;
  referencia_interna?: string;
  etiqueta?: string;
}

interface EncomendaFormProps {
  encomenda?: any; // Para edição
  isEditing?: boolean;
  onSuccess?: () => void;
  valorTotal?: number;
}

export default function EncomendaForm({ encomenda, isEditing = false, onSuccess, valorTotal = 0 }: EncomendaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [itens, setItens] = useState<ItemEncomenda[]>([]);
  const [valorTotalCalculado, setValorTotalCalculado] = useState(0);

  const [formData, setFormData] = useState<EncomendaFormData>({
    numero_encomenda: "",
    cliente_id: "",
    fornecedor_id: "",
    data_producao_estimada: undefined,
    data_envio_estimada: undefined,
    observacoes: "",
    referencia: "",
    referencia_interna: "",
    etiqueta: "",
  });

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from("clientes")
          .select("id, nome")
          .eq("active", true)
          .order("nome");

        if (clientesError) throw clientesError;
        setClientes(clientesData || []);

        // Carregar fornecedores
        const { data: fornecedoresData, error: fornecedoresError } = await supabase
          .from("fornecedores")
          .select("id, nome")
          .eq("active", true)
          .order("nome");

        if (fornecedoresError) throw fornecedoresError;
        setFornecedores(fornecedoresData || []);

        // Se editando, carregar dados da encomenda
        if (isEditing && encomenda) {
          setFormData({
            numero_encomenda: encomenda.numero_encomenda || "",
            cliente_id: encomenda.cliente_id || "",
            fornecedor_id: encomenda.fornecedor_id || "",
            data_producao_estimada: encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined,
            data_envio_estimada: encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined,
            observacoes: encomenda.observacoes || "",
            referencia: encomenda.referencia || "",
            referencia_interna: encomenda.referencia_interna || "",
            etiqueta: encomenda.etiqueta || "",
          });

          // Carregar itens da encomenda
          const { data: itensData, error: itensError } = await supabase
            .from("itens_encomenda")
            .select(`
              id,
              produto_id,
              quantidade,
              preco_unitario,
              preco_custo,
              produtos(nome, marca, tipo, size_weight)
            `)
            .eq("encomenda_id", encomenda.id);

          if (itensError) throw itensError;

          const itensFormatados = (itensData || []).map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto_nome: item.produtos ? `${item.produtos.nome} - ${item.produtos.marca} - ${item.produtos.tipo}` : "",
            quantidade: item.quantidade,
            preco_custo: item.preco_custo,
            preco_venda: item.preco_unitario,
            subtotal: item.quantidade * item.preco_unitario,
            peso_produto: item.produtos?.size_weight || 0,
          }));

          setItens(itensFormatados);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados do formulário");
      }
    };

    loadData();
  }, [isEditing, encomenda]);

  const handleInputChange = (field: keyof EncomendaFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero_encomenda || !formData.cliente_id || !formData.fornecedor_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isEditing && itens.length === 0) {
      toast.error("Adicione pelo menos um item à encomenda");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && encomenda) {
        // Editar encomenda usando a função RPC
        const dadosEncomenda = {
          numero_encomenda: formData.numero_encomenda,
          cliente_id: formData.cliente_id,
          fornecedor_id: formData.fornecedor_id,
          data_producao_estimada: formData.data_producao_estimada ? format(formData.data_producao_estimada, 'yyyy-MM-dd') : null,
          data_envio_estimada: formData.data_envio_estimada ? format(formData.data_envio_estimada, 'yyyy-MM-dd') : null,
          observacoes: formData.observacoes || null,
          referencia: formData.referencia || null,
          referencia_interna: formData.referencia_interna || null,
          etiqueta: formData.etiqueta || null,
        };

        const itensParaSalvar = itens.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_venda,
          preco_custo: item.preco_custo,
        }));

        const { error } = await supabase.rpc('salvar_edicao_encomenda', {
          p_encomenda_id: encomenda.id,
          p_dados: dadosEncomenda,
          p_itens: itensParaSalvar
        });

        if (error) throw error;

        toast.success("Encomenda atualizada com sucesso!");
      } else {
        // Criar nova encomenda
        const { data: novaEncomenda, error: encomendaError } = await supabase
          .from("encomendas")
          .insert([{
            numero_encomenda: formData.numero_encomenda,
            cliente_id: formData.cliente_id,
            fornecedor_id: formData.fornecedor_id,
            data_producao_estimada: formData.data_producao_estimada ? format(formData.data_producao_estimada, 'yyyy-MM-dd') : null,
            data_envio_estimada: formData.data_envio_estimada ? format(formData.data_envio_estimada, 'yyyy-MM-dd') : null,
            observacoes: formData.observacoes || null,
            referencia: formData.referencia || null,
            referencia_interna: formData.referencia_interna || null,
            etiqueta: formData.etiqueta || null,
            valor_total: valorTotalCalculado,
          }])
          .select()
          .single();

        if (encomendaError) throw encomendaError;

        // Inserir itens da encomenda
        if (itens.length > 0) {
          const itensParaInserir = itens.map(item => ({
            encomenda_id: novaEncomenda.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_venda,
            preco_custo: item.preco_custo,
          }));

          const { error: itensError } = await supabase
            .from("itens_encomenda")
            .insert(itensParaInserir);

          if (itensError) throw itensError;
        }

        toast.success("Encomenda criada com sucesso!");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar encomenda:", error);
      toast.error(error.message || "Erro ao salvar encomenda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Encomenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Número da Encomenda *</label>
              <Input
                value={formData.numero_encomenda}
                onChange={(e) => handleInputChange("numero_encomenda", e.target.value)}
                placeholder="Ex: ENC001"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Etiqueta</label>
              <Input
                value={formData.etiqueta}
                onChange={(e) => handleInputChange("etiqueta", e.target.value)}
                placeholder="Ex: URGENTE"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cliente *</label>
              <Select value={formData.cliente_id} onValueChange={(value) => handleInputChange("cliente_id", value)}>
                <SelectTrigger>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Fornecedor *</label>
              <Select value={formData.fornecedor_id} onValueChange={(value) => handleInputChange("fornecedor_id", value)}>
                <SelectTrigger>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Referência</label>
              <Input
                value={formData.referencia}
                onChange={(e) => handleInputChange("referencia", e.target.value)}
                placeholder="Referência externa"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Referência Interna</label>
              <Input
                value={formData.referencia_interna}
                onChange={(e) => handleInputChange("referencia_interna", e.target.value)}
                placeholder="Referência interna"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data de Produção Estimada</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data_producao_estimada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_producao_estimada ? format(formData.data_producao_estimada, "dd/MM/yyyy") : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.data_producao_estimada}
                    onSelect={(date) => handleInputChange("data_producao_estimada", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data de Envio Estimada</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data_envio_estimada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_envio_estimada ? format(formData.data_envio_estimada, "dd/MM/yyyy") : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.data_envio_estimada}
                    onSelect={(date) => handleInputChange("data_envio_estimada", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Observações</label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Itens da Encomenda */}
      <ItensEncomendaManager
        itens={itens}
        onItensChange={setItens}
        onValorTotalChange={setValorTotalCalculado}
      />

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Encomenda" : "Criar Encomenda"}
        </Button>
      </div>
    </form>
  );
}