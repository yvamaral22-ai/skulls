'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Scissors, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Loader2,
  Phone,
  User as UserIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from '@/components/ui/dialog';
import { BookingForm } from '@/components/booking-form';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [targetBarberId, setTargetBarberId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function findBarbershop() {
      // Ajustado para buscar na coleção correta 'barbers'
      const q = query(collection(db, 'barbers'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetBarberId(snap.docs[0].id);
      }
    }
    findBarbershop();
  }, [db]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!targetBarberId || !user) return null;
    return query(
      collection(db, 'barbers', targetBarberId, 'appointments'),
      where('clientId', '==', user.uid)
    );
  }, [db, targetBarberId, user]);

  const servicesQuery = useMemoFirebase(() => {
    if (!targetBarberId) return null;
    return collection(db, 'barbers', targetBarberId, 'services');
  }, [db, targetBarberId]);

  const staffQuery = useMemoFirebase(() => {
    if (!targetBarberId) return null;
    return collection(db, 'barbers', targetBarberId, 'staff');
  }, [db, targetBarberId]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);
  const { data: staff } = useCollection(staffQuery);

  if (isAuthLoading || isApptsLoading || isServicesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-headline text-primary">
            Olá, {user?.displayName?.split(' ')[0] || 'Campeão'}!
          </h1>
          <p className="text-muted-foreground text-sm">Pronto para renovar seu visual na Barbearia Skull's?</p>
        </div>

        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-xl shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Marcar Horário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>Escolha o profissional e o melhor horário para você.</DialogDescription>
            </DialogHeader>
            <BookingForm onSuccess={() => setIsBookingOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none bg-card shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Próximos Cortes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {appointments && appointments.length > 0 ? (
              appointments
                .filter(a => a.status === 'scheduled')
                .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((appt) => {
                  const service = services?.find(s => s.id === appt.serviceId);
                  const barber = staff?.find(s => s.id === appt.staffId);

                  return (
                    <div key={appt.id} className="p-4 rounded-xl bg-secondary/20 border border-border flex items-center justify-between group hover:bg-primary/5 transition-colors">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-primary">{service?.name || 'Serviço'}</p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(appt.date + 'T00:00:00'), 'dd/MM/yyyy')} às {appt.time}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <UserIcon className="h-3 w-3" />
                            Profissional: <span className="text-foreground/80">{barber?.name || 'Não definido'}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary text-[8px] uppercase">Confirmado</Badge>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-10 text-muted-foreground italic text-xs bg-secondary/10 rounded-xl border border-dashed border-border">
                Você ainda não tem agendamentos ativos.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="h-5 w-5 text-primary" />
              Menu de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {services && services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-all border border-border/50">
                  <div>
                    <p className="font-bold text-sm">{service.name}</p>
                    <p className="text-[10px] text-muted-foreground">{service.durationMinutes} min • Visual Impecável</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-black">
                    R$ {Number(service.price).toFixed(2)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-muted-foreground italic text-sm">Carregando catálogo...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 text-center space-y-4">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold font-headline">Precisa falar conosco?</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Caso precise cancelar ou tirar dúvidas, clique no botão abaixo.
        </p>
        <Button variant="outline" className="border-primary/30 text-primary rounded-full px-8 h-12 hover:bg-primary/10">
          <Phone className="mr-2 h-4 w-4" /> WhatsApp de Suporte
        </Button>
      </div>
    </div>
  );
}