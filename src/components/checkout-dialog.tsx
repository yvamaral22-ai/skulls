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
import { CreditCard, Banknote, QrCode, CheckCircle2, ShoppingCart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface CheckoutDialogProps {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  price: number;
  staffId: string;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Dinheiro', icon: Banknote, color: 'text-green-500' },
  { id: 'PIX', label: 'PIX', icon: QrCode, color: 'text-cyan-500' },
  { id: 'Credit', label: 'Crédito', icon: CreditCard, color: 'text-blue-500' },
  { id: 'Debit', label: 'Débito', icon: CreditCard, color: 'text-orange-500' },
];

export function CheckoutDialog({
  appointmentId,
  customerName,
  serviceName,
  price,
  onSuccess,
}: CheckoutDialogProps) {
  const db = useFirestore();
  const { barberProfileId } = useUser();
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!selectedMethod) {
      toast({ variant: 'destructive', title: 'Atenção', description: 'Selecione um método de pagamento.' });
      return;
    }

    if (!barberProfileId) return;

    setIsProcessing(true);
    try {
      const appointmentPrice = Number(price);
      // Sincronizado para a coleção correta 'barbers'
      const appointmentRef = doc(db, 'barbers', barberProfileId, 'appointments', appointmentId);
      
      await updateDoc(appointmentRef, {
        status: 'completed',
        paymentMethod: selectedMethod,
        priceAtAppointment: appointmentPrice,
        completedAt: new Date().toISOString()
      });

      toast({
        title: 'Sucesso!',
        description: `Pagamento via ${selectedMethod} registrado.`,
      });

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast({
        variant: 'destructive',
        title: 'Erro no Processamento',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 uppercase text-[10px]">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Atendimento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-card border-none shadow-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2 text-primary uppercase">
            <ShoppingCart className="h-6 w-6" />
            Checkout
          </DialogTitle>
          <DialogDescription className="uppercase text-[9px] tracking-widest">
            Confirmar pagamento de {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-60 uppercase font-bold tracking-tighter text-[10px]">Serviço Prestado</span>
              <span className="font-bold text-white">{serviceName}</span>
            </div>
            <div className="flex justify-between items-center text-xl pt-2 border-t border-border/50 mt-2">
              <span className="font-black uppercase tracking-tighter text-sm">Total a Pagar</span>
              <span className="font-black text-primary">R$ {Number(price).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 hover:scale-[1.02] active:scale-95",
                    selectedMethod === method.id 
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" 
                      : "border-border bg-secondary/20 opacity-60 hover:opacity-100"
                  )}
                >
                  <Icon className={cn("h-6 w-6", method.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button 
            className="w-full h-14 bg-primary text-black font-black text-lg shadow-xl uppercase tracking-tighter" 
            disabled={!selectedMethod || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'CONFIRMAR RECEBIMENTO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
