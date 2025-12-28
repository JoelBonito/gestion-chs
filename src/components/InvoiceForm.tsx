import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload, Save } from 'lucide-react';
import { InvoiceFormData } from '@/types/invoice';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? null);
    })();
  }, []);

  // Permissão: admin role OU finance role OU e-mails autorizados
  const canCreate =
    hasRole('admin') ||
    hasRole('finance') ||
    userEmail?.toLowerCase() === "admin@admin.com" ||
    userEmail?.toLowerCase() === "jbento1@gmail.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

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
        file: selectedFile || undefined
      });
      setFormData({
        invoice_date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
      });
      setSelectedFile(null);
    } catch (error) {
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
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo permitido: 10MB');
      return;
    }
    setSelectedFile(file);
  };

  if (!canCreate) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground" id="no-permission">
          Você não tem permissão para criar faturas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="invoice-form-description">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_date" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Data da Fatura</Label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-4 w-4" />
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                className="pl-10 h-11 bg-popover border-border/40 font-semibold transition-all focus:ring-primary/20"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Valor da Fatura</Label>
            <div className="relative group">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="pl-8 h-11 bg-popover border-border/40 font-semibold transition-all focus:ring-primary/20"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">€</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Descrição (Opcional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição da fatura..."
            rows={2}
            className="min-h-[44px] bg-popover border-border/40 resize-none py-2.5 transition-all focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Documento PDF (Opcional)</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="flex-1 h-11 bg-popover border-border/40 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-success/10 text-success rounded-lg text-xs font-semibold border border-success/20">
                <Upload className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{selectedFile.name}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            * Anexe um arquivo PDF até 10MB.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <>
                <Upload className="w-5 h-5 mr-2 animate-spin" />
                Salvando Fatura...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Fatura
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
