import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EncomendaView from "@/components/EncomendaView";

interface PrintModalProps {
  encomendaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintModal({ encomendaId, isOpen, onClose }: PrintModalProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && encomendaId) {
      setLoaded(false);
      // Aguarda o modal e o conteúdo carregarem completamente
      const timer = setTimeout(() => {
        setLoaded(true);
        // Aguarda mais um pouco para garantir que tudo renderizou
        setTimeout(() => {
          window.print();
        }, 500);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, encomendaId]);

  const handleClose = () => {
    setLoaded(false);
    onClose();
  };

  if (!encomendaId) return null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { 
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
        @page {
          margin: 1cm;
          size: A4;
        }
      `}</style>
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print-content">
          <div className="no-print absolute right-4 top-4 z-50">
            <button
              onClick={handleClose}
              className="rounded-md p-1 hover:bg-muted"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          
          <div className="print:p-0">
            <EncomendaView encomendaId={encomendaId} />
          </div>
          
          {!loaded && (
            <div className="no-print absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-sm text-muted-foreground">
                Preparando impressão...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}