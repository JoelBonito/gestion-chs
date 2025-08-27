
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload, Save } from 'lucide-react';
import { InvoiceFormData } from '@/types/invoice';
import { useUserRole } from '@/hooks/useUserRole';

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { hasRole } = useUserRole();
  
  const canCreate = hasRole('admin') || hasRole('finance');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreate) return;
    
    if (!selectedFile) {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.invoice_date > today) {
      alert('A data da fatura não pode ser futura.');
      return;
    }

    if (formData.amount <= 0) {
      alert('O valor deve ser maior que zero.');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        file: selectedFile
      });

      // Reset form only after successful submission
      setFormData({
        invoice_date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
      });
      setSelectedFile(null);
    } catch (error) {
      // Error is handled by the parent component/hook
      console.error('Erro ao submeter fatura:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Arquivo muito grande. Máximo permitido: 10MB');
      return;
    }

    setSelectedFile(file);
  };

  if (!canCreate) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Você não tem permissão para criar faturas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoice_date">Data da Fatura</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                className="pl-10"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor da Fatura (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (Opcional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição da fatura..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">Documento PDF *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="flex-1"
              required
            />
            {selectedFile && (
              <div className="flex items-center gap-1 text-sm text-success">
                <Upload className="h-4 w-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Apenas arquivos PDF até 10MB são permitidos.
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || !selectedFile}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Fatura
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
