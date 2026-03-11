
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
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  staffId,
  onSuccess,
}: CheckoutDialogProps) {
  const db = useFirestore();
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const barberShopId = "master-barbershop";

  const handleCheckout = async () => {
    if (!selectedMethod) {
      toast({ variant: 'destructive', title: 'Atenção', description: 'Selecione um método de pagamento.' });
      return;
    }

    setIsProcessing(true);
    try {
      // Busca a comissão atual do barbeiro
      const staffRef = doc(db, 'barberProfiles', barberShopId, 'staff', staffId);
      const staffSnap = await getDoc(staffRef);
      const staffData = staffSnap.data();
      const commissionRate = staffData?.commissionRate || 0.4;
      
      const appointmentPrice = Number(price);
      const commissionAmount = appointmentPrice * commissionRate;

      const appointmentRef = doc(db, 'barberProfiles', barberShopId, 'appointments', appointmentId);
      
      await updateDoc(appointmentRef, {
        status: 'completed',
        paymentMethod: selectedMethod,
        priceAtAppointment: appointmentPrice,
        commissionAtAppointment: commissionAmount,
        completedAt: new Date().toISOString()
      });

      toast({
        title: 'Sucesso!',
        description: `Pagamento via ${selectedMethod} registrado para ${customerName}.`,
      });

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro no checkout:", error);
      toast({
        variant: 'destructive',
        title: 'Erro no Processamento',
        description: 'Não foi possível finalizar o atendimento no banco de dados.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12">
          <CheckCircle2 className="mr-2 h-5 w-5" /> Finalizar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Checkout
          </DialogTitle>
          <DialogDescription>
            Confirmar recebimento de {customerName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-60 uppercase font-bold tracking-tighter">Serviço</span>
              <span className="font-bold">{serviceName}</span>
            </div>
            <div className="flex justify-between items-center text-xl pt-2 border-t mt-2">
              <span className="font-black uppercase tracking-tighter">Total</span>
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
                      : "border-border bg-secondary/20 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <Icon className={cn("h-6 w-6", method.color)} />
                  <span className="text-[10px] font-bold uppercase">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button 
            className="w-full h-14 bg-primary text-white font-black text-lg shadow-xl" 
            disabled={!selectedMethod || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'CONFIRMAR PAGAMENTO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
