
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FornecedorForm } from "./FornecedorForm";

interface FornecedorFormDialogProps {
  onFornecedorCreated: (fornecedor: { id: string; nome: string }) => void;
}

export function FornecedorFormDialog({ onFornecedorCreated }: FornecedorFormDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    // Fetch the latest supplier data to get the created supplier
    // Since we can't get the data directly from the form, we'll trigger a refresh
    // The parent component should handle refetching the suppliers list
    window.location.reload(); // Temporary solution to refresh data
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Plus className="h-4 w-4 mr-1" />
          Novo Fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Criar um novo fornecedor no sistema
          </DialogDescription>
        </DialogHeader>
        <FornecedorForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
