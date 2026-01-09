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
import { Store, Mail, Phone, MapPin, Info, Save, X, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const fornecedorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  contato: z.string().optional(),
  observacoes: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  contato?: string;
  observacoes?: string;
}

interface FornecedorFormProps {
  onSuccess?: (fornecedor?: { id: string; nome: string }) => void;
  initialData?: Fornecedor | null;
  isEditing?: boolean;
}




const SectionStyles = "bg-popover border border-border/20 rounded-xl p-5 mb-4 hover:border-primary/50 transition-all duration-300 shadow-sm";
const LabelStyles = "text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 mb-1.5";
const InputStyles = "bg-accent border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all h-10";

export function FornecedorForm({ onSuccess, initialData, isEditing = false }: FornecedorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
      contato: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome || "",
        email: initialData.email || "",
        telefone: initialData.telefone || "",
        endereco: initialData.endereco || "",
        contato: initialData.contato || "",
        observacoes: (initialData as any).observacoes || "",
      });
    } else {
      form.reset({
        nome: "",
        email: "",
        telefone: "",
        endereco: "",
        contato: "",
        observacoes: "",
      });
    }
  }, [form, initialData]);

  const onSubmit = async (data: FornecedorFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        const { error } = await supabase
          .from("fornecedores")
          .update({
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
            contato: data.contato || null,
            observacoes: data.observacoes || null,
          })
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
        onSuccess?.();
      } else {
        const { data: novoFornecedor, error } = await supabase
          .from("fornecedores")
          .insert([{
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            endereco: data.endereco || null,
            contato: data.contato || null,
            observacoes: data.observacoes || null,
          }])
          .select()
          .single();

        if (error) throw error;
        toast.success("Fornecedor cadastrado com sucesso!");
        form.reset();
        onSuccess?.(novoFornecedor ? { id: novoFornecedor.id, nome: novoFornecedor.nome } : undefined);
      }
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <div className={SectionStyles}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Nome / Razão Social *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: FABRICA DE VIDROS SA" {...field} className={cn(InputStyles, "uppercase font-bold")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}><Mail className="w-3 h-3" /> Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contato@fornecedor.com" type="email" {...field} className={InputStyles} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LabelStyles}><Phone className="w-3 h-3" /> Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="+351 000 000 000" {...field} className={InputStyles} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}>Gestor de Conta / Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do representante comercial" {...field} className={cn(InputStyles, "uppercase")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LabelStyles}><MapPin className="w-3 h-3" /> Endereço da Sede</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Morada completa do fornecedor..." {...field} className={cn(InputStyles, "min-h-[80px] resize-none")} />
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
                  <FormLabel className={LabelStyles}>Notas e Condições</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Prazos, condições de pagamento ou notas gerais..."
                      className={cn(InputStyles, "min-h-[80px] resize-none")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="cancel" onClick={() => onSuccess?.()}>
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}