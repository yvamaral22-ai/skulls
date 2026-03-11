
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  const { user } = useUser();
  const db = useFirestore();
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleCheckout = async () => {
    if (!selectedMethod || !user) return;

    setIsProcessing(true);
    try {
      // Buscar a taxa de comissão atual do barbeiro no Firestore
      const staffRef = doc(db, 'barberProfiles', user.uid, 'staff', staffId);
      const staffSnap = await getDoc(staffRef);
      const staffData = staffSnap.data();
      const commissionRate = staffData?.commissionRate || 0.4; // Default 40%
      
      const appointmentPrice = Number(price);
      const commissionAmount = appointmentPrice * commissionRate;

      const appointmentRef = doc(db, 'barberProfiles', user.uid, 'appointments', appointmentId);
      
      updateDocumentNonBlocking(appointmentRef, {
        status: 'completed',
        paymentMethod: selectedMethod,
        priceAtAppointment: appointmentPrice,
        commissionAtAppointment: commissionAmount,
        completedAt: new Date().toISOString()
      });

      toast({
        title: 'Atendimento Concluído!',
        description: `O checkout de ${customerName} foi realizado com sucesso via ${selectedMethod}.`,
      });

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro no Checkout',
        description: 'Não foi possível finalizar o atendimento.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Finalizar Atendimento
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes e receba o pagamento.
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
              <Badge variant="secondary" className="bg-primary/20 text-primary">{serviceName}</Badge>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-2xl font-black text-primary">R$ {Number(price).toFixed(2)}</span>
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
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
