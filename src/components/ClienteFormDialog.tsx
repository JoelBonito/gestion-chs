
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClienteForm } from "./ClienteForm";

interface ClienteFormDialogProps {
  onClienteCreated: (cliente: { id: string; nome: string }) => void;
}

export function ClienteFormDialog({ onClienteCreated }: ClienteFormDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (cliente: { id: string; nome: string }) => {
    setOpen(false);
    onClienteCreated(cliente);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Plus className="h-4 w-4 mr-1" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Criar um novo cliente no sistema
          </DialogDescription>
        </DialogHeader>
        <ClienteForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
