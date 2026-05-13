import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Plus, Store, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FornecedorForm } from "@/components/fornecedores";
import { supabase } from "@/integrations/supabase/client";

interface Fornecedor {
  id: string;
  nome: string;
}

interface FornecedorSelectProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Fornecedor sugerido (ex: Nonato, Carol) - pode ser alterado pelo usuário */
  suggestedFornecedor?: { id: string; nome: string } | null;
}

export function FornecedorSelect({
  value,
  onChange,
  placeholder = "Escolher fornecedor...",
  disabled = false,
  suggestedFornecedor = null,
}: FornecedorSelectProps) {
  const [open, setOpen] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .eq("active", true)
      .order("nome");
    if (data) setFornecedores(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) fetchFornecedores();
  }, [open, fetchFornecedores]);

  useEffect(() => {
    if (!value) return;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return;
    if (fornecedores.some((fornecedor) => fornecedor.id === value)) return;

    const fetchSelectedFornecedor = async () => {
      const { data } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("id", value)
        .maybeSingle();

      if (data) {
        setFornecedores((prev) =>
          prev.some((fornecedor) => fornecedor.id === data.id)
            ? prev
            : [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }
    };

    fetchSelectedFornecedor();
  }, [value, fornecedores]);

  // Determine effective value: user selection > suggested
  const effectiveValue = value || suggestedFornecedor?.id;

  // Determine display label
  const getDisplayLabel = () => {
    if (value) {
      const found = fornecedores.find((f) => f.id === value);
      if (found) return found.nome;
    }
    if (suggestedFornecedor) return suggestedFornecedor.nome;
    return placeholder;
  };

  const isSuggested = !value && suggestedFornecedor;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between text-xs h-8 px-2 font-medium transition-all",
              isSuggested
                ? "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                : "bg-accent border-border/50 text-foreground hover:bg-accent/80"
            )}
          >
            <span className="truncate flex items-center gap-1.5">
              {isSuggested && <Star className="h-3 w-3 text-amber-500" />}
              {getDisplayLabel()}
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0 bg-popover border-border/40">
          <Command>
            <CommandInput
              placeholder="Buscar fornecedor..."
              className="h-9 text-xs"
            />
            <CommandList>
              <CommandEmpty className="text-xs py-3 text-center text-muted-foreground">
                {loading ? "Carregando..." : "Nenhum fornecedor encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {suggestedFornecedor && (
                  <CommandItem
                    key={suggestedFornecedor.id}
                    value={suggestedFornecedor.nome}
                    onSelect={() => {
                      onChange(suggestedFornecedor.id);
                      setOpen(false);
                    }}
                    className="text-xs cursor-pointer text-amber-600 dark:text-amber-400"
                  >
                    <Star className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    {suggestedFornecedor.nome}
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-muted-foreground">
                      Sugerido
                    </span>
                  </CommandItem>
                )}
                {fornecedores
                  .filter((f) => f.id !== suggestedFornecedor?.id)
                  .map((f) => (
                    <CommandItem
                      key={f.id}
                      value={f.nome}
                      onSelect={() => {
                        onChange(f.id);
                        setOpen(false);
                      }}
                      className="text-xs cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          effectiveValue === f.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {f.nome}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="text-xs text-primary cursor-pointer"
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Criar novo fornecedor
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader className="mb-4 border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Store className="text-primary h-5 w-5" />
              Novo Fornecedor
            </DialogTitle>
          </DialogHeader>
          <FornecedorForm
            onSuccess={(fornecedor) => {
              if (fornecedor) {
                onChange(fornecedor.id);
                setFornecedores((prev) =>
                  [...prev, fornecedor].sort((a, b) =>
                    a.nome.localeCompare(b.nome)
                  )
                );
              }
              setShowCreateDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
