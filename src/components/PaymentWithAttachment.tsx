
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, CreditCard } from 'lucide-react';
import { AttachmentManager } from './AttachmentManager';

interface PaymentWithAttachmentProps {
  encomendaId: string;
  onPaymentConfirm: () => void;
  children: React.ReactNode;
}

export const PaymentWithAttachment: React.FC<PaymentWithAttachmentProps> = ({
  encomendaId,
  onPaymentConfirm,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePaymentConfirm = () => {
    onPaymentConfirm();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Confirmar Pagamento
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
            <TabsTrigger value="attachment">Comprovante</TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Confirme o pagamento desta encomenda. Você pode anexar um comprovante na aba "Comprovante".
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="cancel" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handlePaymentConfirm}>
                Confirmar Pagamento
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="attachment" className="space-y-4">
            <AttachmentManager
              entityType="pagamento"
              entityId={encomendaId}
              title="Comprovante de Pagamento"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
