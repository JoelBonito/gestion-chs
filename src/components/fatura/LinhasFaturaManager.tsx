import { useEffect, useState } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { calcularSubtotalLinha } from "@/lib/fatura/calculos";
import { formatCurrencyEUR } from "@/lib/utils/currency";
import type { LinhaFatura } from "@/lib/fatura/types";

interface ProdutoOption {
  id: string;
  nome: string;
  marca: string | null;
  descricao: string | null;
  preco_venda: number;
}

interface LinhasFaturaManagerProps {
  linhas: LinhaFatura[];
  onChange: (linhas: LinhaFatura[]) => void;
}

const UNIDADES = ["Unidade", "Kg", "Lt", "Cx", "Pack"] as const;

const inputCls =
  "bg-popover border-border/40 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/20 h-10";

export function novaLinhaVazia(): LinhaFatura {
  return {
    uid: crypto.randomUUID(),
    produto_id: null,
    descricao: "",
    preco: 0,
    qtd: 1,
    unidade: "Unidade",
    desconto: 0,
    iva: 0,
    nota_isencao: null,
    subtotal: 0,
  };
}

function rotuloProduto(p: ProdutoOption): string {
  return p.marca ? `${p.marca} - ${p.nome}` : p.nome;
}

export function LinhasFaturaManager({ linhas, onChange }: LinhasFaturaManagerProps) {
  const [produtos, setProdutos] = useState<ProdutoOption[]>([]);
  const [openProdutoIdx, setOpenProdutoIdx] = useState<number | null>(null);

  useEffect(() => {
    void carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, marca, descricao, preco_venda")
      .eq("ativo", true)
      .order("marca", { ascending: true, nullsFirst: false })
      .order("nome", { ascending: true });
    if (!error && data) setProdutos(data as ProdutoOption[]);
  }

  function atualizarLinha(idx: number, patch: Partial<LinhaFatura>) {
    const next = linhas.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      return { ...merged, subtotal: calcularSubtotalLinha(merged) };
    });
    onChange(next);
  }

  function removerLinha(idx: number) {
    onChange(linhas.filter((_, i) => i !== idx));
  }

  function adicionarLinha() {
    onChange([novaLinhaVazia(), ...linhas]);
  }

  function aplicarProduto(idx: number, produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;
    const descricao = produto.marca
      ? `${produto.marca} - ${produto.nome}`
      : produto.nome;
    atualizarLinha(idx, {
      produto_id: produto.id,
      descricao,
      preco: produto.preco_venda,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Linhas da Fatura
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarLinha}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Adicionar linha
        </Button>
      </div>

      {linhas.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          Nenhuma linha. Clique em "Adicionar linha" para começar.
        </div>
      )}

      <div className="space-y-3">
        {linhas.map((linha, idx) => (
          <div
            key={linha.uid}
            className="rounded-lg border border-border/50 bg-card/60 p-4 space-y-3"
          >
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-4">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Produto (opcional)
                </Label>
                <Popover
                  open={openProdutoIdx === idx}
                  onOpenChange={(o) => setOpenProdutoIdx(o ? idx : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        inputCls,
                        "w-full justify-between font-normal",
                        !linha.produto_id && "text-muted-foreground"
                      )}
                    >
                      <span className="truncate">
                        {linha.produto_id
                          ? rotuloProduto(
                              produtos.find((p) => p.id === linha.produto_id) ?? {
                                id: "",
                                nome: linha.descricao,
                                marca: null,
                                descricao: null,
                                preco_venda: 0,
                              }
                            )
                          : "Selecione ou deixe em branco"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <Command>
                      <CommandInput placeholder="Buscar produto..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {produtos.map((p) => {
                            const rotulo = rotuloProduto(p);
                            return (
                              <CommandItem
                                key={p.id}
                                value={rotulo}
                                onSelect={() => {
                                  aplicarProduto(idx, p.id);
                                  setOpenProdutoIdx(null);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    linha.produto_id === p.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {rotulo}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-12 md:col-span-8">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Descrição
                </Label>
                <Input
                  value={linha.descricao}
                  onChange={(e) => atualizarLinha(idx, { descricao: e.target.value })}
                  placeholder="Descrição do artigo/serviço"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 md:col-span-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Preço (€)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={linha.preco}
                  onChange={(e) =>
                    atualizarLinha(idx, { preco: Number(e.target.value) || 0 })
                  }
                  className={inputCls}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Qtd
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={linha.qtd}
                  onChange={(e) =>
                    atualizarLinha(idx, { qtd: Number(e.target.value) || 0 })
                  }
                  className={inputCls}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Unidade
                </Label>
                <Select
                  value={linha.unidade}
                  onValueChange={(v) => atualizarLinha(idx, { unidade: v })}
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-6 md:col-span-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Desconto %
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={linha.desconto}
                  onChange={(e) =>
                    atualizarLinha(idx, { desconto: Number(e.target.value) || 0 })
                  }
                  className={inputCls}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  IVA %
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={linha.iva}
                  onChange={(e) =>
                    atualizarLinha(idx, { iva: Number(e.target.value) || 0 })
                  }
                  className={inputCls}
                />
              </div>

              <div className="col-span-6 md:col-span-2 flex flex-col">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Subtotal c/IVA
                </Label>
                <div className="h-10 flex items-center justify-end pr-2 rounded-md bg-popover/40 border border-border/30 text-sm font-semibold text-foreground">
                  {formatCurrencyEUR(linha.subtotal)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12 md:col-span-10">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-wide mb-1 block">
                  Nota de isenção (opcional)
                </Label>
                <Input
                  value={linha.nota_isencao ?? ""}
                  onChange={(e) =>
                    atualizarLinha(idx, {
                      nota_isencao: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                  placeholder="Ex: Isento art. 9.º do CIVA"
                  className={inputCls}
                />
              </div>
              <div className="col-span-12 md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removerLinha(idx)}
                  className="w-full gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
