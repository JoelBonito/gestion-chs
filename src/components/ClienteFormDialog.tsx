
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

  const handleSuccess = () => {
    setOpen(false);
    // Fetch the latest client data to get the created client
    // Since we can't get the data directly from the form, we'll trigger a refresh
    // The parent component should handle refetching the clients list
    window.location.reload(); // Temporary solution to refresh data
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Plus className="h-4 w-4 mr-1" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
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
