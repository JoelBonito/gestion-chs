import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Calendar,
  CalendarIcon,
  FileText,
  User,
  Package,
  Palette,
  Droplets,
  Wind,
  Plus,
  Info,
  Check,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const amostraSchema = z.object({
  data: z.date(),
  referencia: z.string().min(1, "Referência é obrigatória"),
  cliente_id: z.string().optional(),
  projeto: z.string().optional(),
  tipo_produto: z.string().optional(),
  cor: z.string().optional(),
  textura: z.string().optional(),
  fragrancia: z.string().optional(),
  ingredientes_adicionais: z.string().optional(),
  quantidade_amostras: z.number().min(1, "Quantidade deve ser no mínimo 1"),
  data_envio: z.date().optional(),
  observacoes: z.string().optional(),
});

type AmostraFormData = z.infer<typeof amostraSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface AmostraFormProps {
  amostra?: {
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
  };
  onSuccess: () => void;
}

export function AmostraForm({ amostra, onSuccess }: AmostraFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<AmostraFormData>({
    resolver: zodResolver(amostraSchema),
    defaultValues: {
      data: amostra ? new Date(amostra.data) : new Date(),
      referencia: amostra?.referencia || "",
      cliente_id: amostra?.cliente_id || "",
      projeto: amostra?.projeto || "",
      tipo_produto: amostra?.tipo_produto || "",
      cor: amostra?.cor || "",
      textura: amostra?.textura || "",
      fragrancia: amostra?.fragrancia || "",
      ingredientes_adicionais: amostra?.ingredientes_adicionais || "",
      quantidade_amostras: amostra?.quantidade_amostras || 1,
      data_envio: amostra?.data_envio ? new Date(amostra.data_envio) : undefined,
      observacoes: amostra?.observacoes || "",
    },
  });

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nome")
          .eq("active", true)
          .order("nome");

        if (error) throw error;
        setClientes(data || []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    };

    fetchClientes();
  }, []);

  const onSubmit = async (data: AmostraFormData) => {
    try {
      setLoading(true);

      const formattedData = {
        data: format(data.data, "yyyy-MM-dd"),
        referencia: data.referencia,
        cliente_id: data.cliente_id || null,
        projeto: data.projeto || null,
        tipo_produto: data.tipo_produto || null,
        cor: data.cor || null,
        textura: data.textura || null,
        fragrancia: data.fragrancia || null,
        ingredientes_adicionais: data.ingredientes_adicionais || null,
        quantidade_amostras: data.quantidade_amostras,
        data_envio: data.data_envio ? format(data.data_envio, "yyyy-MM-dd") : null,
        observacoes: data.observacoes || null,
      };

      if (amostra) {
        const { error } = await supabase
          .from("amostras")
          .update(formattedData)
          .eq("id", amostra.id);

        if (error) throw error;
        toast.success("Amostra atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("amostras").insert([formattedData]);

        if (error) throw error;
        toast.success("Amostra criada com sucesso!");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar amostra:", error);
      toast.error("Erro ao salvar amostra");
    } finally {
      setLoading(false);
    }
  };

  const InputStyles =
    "bg-accent border-border/40 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all";
  const LabelStyles = "text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block";
  const SectionStyles =
    "bg-popover border border-border/40 p-5 rounded-2xl shadow-sm mb-6 hover:border-border/60 transition-all duration-300";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Seção 1: Identificação */}
        <div className={SectionStyles}>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="text-primary h-4 w-4" />
            <h3 className="text-foreground text-sm font-bold tracking-tight uppercase">
              Identificação da Amostra
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={LabelStyles}>Data de Criação</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="ghost"
                          className={cn(
                            InputStyles,
                            "border-border/10 hover:bg-muted/50 h-11 w-full border pl-3 text-left text-xs font-bold tracking-widest uppercase transition-all dark:hover:bg-accent",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecionar data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="bg-popover border-border/10 w-auto p-0 shadow-xl"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Referência</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: LINHA DETOX V2"
                      {...field}
                      className={cn(InputStyles, "h-11 font-bold uppercase")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(InputStyles, "h-11 font-medium uppercase")}>
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border/10 text-foreground">
                      {clientes.map((cliente) => (
                        <SelectItem
                          key={cliente.id}
                          value={cliente.id}
                          className="focus:bg-accent focus:text-accent-foreground font-medium uppercase"
                        >
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Projeto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: CRONOGRAMA CAPILAR"
                      {...field}
                      className={cn(InputStyles, "h-11 font-bold uppercase")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção 2: Especificações Técnicas */}
        <div className={SectionStyles}>
          <div className="mb-4 flex items-center gap-2">
            <Package className="text-primary h-4 w-4" />
            <h3 className="text-foreground text-sm font-bold tracking-tight uppercase">
              Especificações Técnicas
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tipo_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Tipo de Produto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SHAMPOO, MÁSCARA"
                      {...field}
                      className={cn(InputStyles, "h-11 font-medium uppercase")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Cor</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Palette className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cor do produto"
                        {...field}
                        className={cn(InputStyles, "h-11 pl-10")}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="textura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Textura</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Droplets className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Textura do produto"
                        {...field}
                        className={cn(InputStyles, "h-11 pl-10")}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fragrancia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Fragrância</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Wind className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Fragrância do produto"
                        {...field}
                        className={cn(InputStyles, "h-11 pl-10")}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção 3: Logística e Obs */}
        <div className={SectionStyles}>
          <div className="mb-4 flex items-center gap-2">
            <Info className="text-primary h-4 w-4" />
            <h3 className="text-foreground text-sm font-bold tracking-tight uppercase">
              Logística e Notas
            </h3>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="quantidade_amostras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Qtd. Amostras</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      className={cn(InputStyles, "h-11")}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_envio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={LabelStyles}>Previsão de Envio</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="ghost"
                          className={cn(
                            InputStyles,
                            "border-border/10 hover:bg-muted/50 h-11 w-full border pl-3 text-left text-xs font-bold tracking-widest uppercase transition-all dark:hover:bg-accent",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecionar data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="bg-popover border-border/10 w-auto p-0 shadow-xl"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="ingredientes_adicionais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Ingredientes Adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os ingredientes extras..."
                      className={cn(InputStyles, "h-20 resize-none")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Observações Gerais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas importantes sobre esta amostra..."
                      className={cn(InputStyles, "h-20 resize-none")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="cancel"
            className="border-transparent"
            onClick={() => onSuccess()}
          >
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {amostra ? "Salvar Alterações" : "Criar Amostra"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
