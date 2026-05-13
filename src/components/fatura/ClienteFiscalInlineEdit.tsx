import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClienteFiscalInlineEditProps {
  clienteId: string;
  onSaved: () => void;
}

interface ClienteFiscal {
  nome_social: string;
  nif: string;
  codigo_cliente: string;
  endereco: string;
  codigo_postal: string;
  cidade: string;
  pais: string;
}

const EMPTY: ClienteFiscal = {
  nome_social: "",
  nif: "",
  codigo_cliente: "",
  endereco: "",
  codigo_postal: "",
  cidade: "",
  pais: "Portugal",
};

const inputCls =
  "bg-popover border-border/40 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 h-10";

const labelCls =
  "text-[10px] font-semibold uppercase text-muted-foreground tracking-wide";

export function ClienteFiscalInlineEdit({
  clienteId,
  onSaved,
}: ClienteFiscalInlineEditProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClienteFiscal>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void carregar();
  }, [open, clienteId]);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clientes")
      .select("nome_social, nif, codigo_cliente, endereco, codigo_postal, cidade, pais")
      .eq("id", clienteId)
      .maybeSingle();
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar dados fiscais");
      return;
    }
    if (data) {
      setForm({
        nome_social: data.nome_social ?? "",
        nif: data.nif ?? "",
        codigo_cliente: data.codigo_cliente ?? "",
        endereco: data.endereco ?? "",
        codigo_postal: data.codigo_postal ?? "",
        cidade: data.cidade ?? "",
        pais: data.pais ?? "Portugal",
      });
    }
  }

  function setField<K extends keyof ClienteFiscal>(key: K, value: ClienteFiscal[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function salvar() {
    setSaving(true);
    const payload = {
      nome_social: form.nome_social.trim() || null,
      nif: form.nif.trim() || null,
      codigo_cliente: form.codigo_cliente.trim() || null,
      endereco: form.endereco.trim() || null,
      codigo_postal: form.codigo_postal.trim() || null,
      cidade: form.cidade.trim() || null,
      pais: form.pais.trim() || null,
    };
    const { error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", clienteId);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar dados fiscais");
      return;
    }
    toast.success("Dados fiscais atualizados");
    setOpen(false);
    onSaved();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1">
          <Pencil className="h-3.5 w-3.5" />
          Completar dados fiscais
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-4" align="start">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Dados fiscais do cliente</h4>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              A carregar...
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className={labelCls}>Nome Social / Razão</Label>
                <Input
                  value={form.nome_social}
                  onChange={(e) => setField("nome_social", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>NIF</Label>
                <Input
                  value={form.nif}
                  onChange={(e) => setField("nif", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Código Cliente</Label>
                <Input
                  value={form.codigo_cliente}
                  onChange={(e) => setField("codigo_cliente", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <Label className={labelCls}>Endereço</Label>
                <Input
                  value={form.endereco}
                  onChange={(e) => setField("endereco", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Código Postal</Label>
                <Input
                  value={form.codigo_postal}
                  onChange={(e) => setField("codigo_postal", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <Label className={labelCls}>Cidade</Label>
                <Input
                  value={form.cidade}
                  onChange={(e) => setField("cidade", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <Label className={labelCls}>País</Label>
                <Input
                  value={form.pais}
                  onChange={(e) => setField("pais", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={salvar}
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  A guardar...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
