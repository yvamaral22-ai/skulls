
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, QrCode, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface CheckoutDialogProps {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  price: number;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Dinheiro', icon: Banknote, color: 'text-green-500' },
  { id: 'PIX', label: 'PIX', icon: QrCode, color: 'text-cyan-500' },
  { id: 'Credit', label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-500' },
  { id: 'Debit', label: 'Cartão de Débito', icon: CreditCard, color: 'text-orange-500' },
];

export function CheckoutDialog({
  appointmentId,
  customerName,
  serviceName,
  price,
  onSuccess,
}: CheckoutDialogProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleCheckout = () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    // Simulação de delay de processamento
    setTimeout(() => {
      console.log('Finalizando atendimento:', {
        appointmentId,
        paymentMethod: selectedMethod,
        finalPrice: price,
      });

      toast({
        title: 'Atendimento Concluído!',
        description: `O checkout de ${customerName} foi realizado com sucesso via ${selectedMethod}.`,
      });

      setIsProcessing(false);
      if (onSuccess) onSuccess();
    }, 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Checkout
          </DialogTitle>
          <DialogDescription>
            Selecione a forma de pagamento para concluir o atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="font-bold">{customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Serviço:</span>
              <Badge variant="secondary">{serviceName}</Badge>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
              <span className="text-lg font-bold">Total a pagar:</span>
              <span className="text-2xl font-black text-primary">R$ {price.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2",
                    selectedMethod === method.id 
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                      : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
                  )}
                >
                  <Icon className={cn("h-6 w-6", method.color)} />
                  <span className="text-xs font-bold uppercase">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold" 
            disabled={!selectedMethod || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? 'Processando...' : 'Confirmar Recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility to merge classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
