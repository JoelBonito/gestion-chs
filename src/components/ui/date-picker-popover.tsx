/**
 * DatePickerPopover - Seletor de data com fechamento automático
 * Fecha o popover automaticamente ao selecionar uma data
 */
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerPopoverProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  formatStr?: string;
  disabled?: boolean;
  /**
   * Estilo do trigger:
   * - "button": Botão com ícone (padrão para formulários)
   * - "inline": Texto editável inline (para listas/cards)
   */
  variant?: "button" | "inline";
  /**
   * Texto a exibir quando não há data
   */
  emptyText?: string;
}

export function DatePickerPopover({
  value,
  onChange,
  placeholder = "Selecionar...",
  className,
  triggerClassName,
  formatStr = "dd/MM/yyyy",
  disabled = false,
  variant = "button",
  emptyText = "—",
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const displayValue = value
    ? format(value, formatStr)
    : variant === "button"
      ? placeholder
      : emptyText;

  if (variant === "inline") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "hover:text-primary group flex items-center gap-1 text-left text-xs font-medium transition-colors sm:text-sm",
              disabled && "pointer-events-none opacity-50",
              triggerClassName
            )}
            disabled={disabled}
          >
            <span>{displayValue}</span>
            <Edit className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-auto p-0", className)} align="start">
          <Calendar mode="single" selected={value} onSelect={handleSelect} initialFocus />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-bold",
            !value && "text-muted-foreground",
            triggerClassName
          )}
        >
          {displayValue}
          <CalendarIcon className="text-muted-foreground h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", className)} align="start">
        <Calendar mode="single" selected={value} onSelect={handleSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
