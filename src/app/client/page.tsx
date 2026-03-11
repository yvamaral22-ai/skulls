
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Scissors, 
  Clock, 
  User, 
  Plus, 
  CheckCircle2, 
  Loader2,
  Phone
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

  // No modelo SaaS, precisamos saber de qual barbearia o cliente está vendo.
  // Para o protótipo, vamos buscar a primeira barbearia cadastrada no sistema.
  React.useEffect(() => {
    async function findBarbershop() {
      const q = query(collection(db, 'barberProfiles'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetBarberId(snap.docs[0].id);
      }
    }
    findBarbershop();
  }, [db]);

  // Agendamentos DO CLIENTE
  const appointmentsQuery = useMemoFirebase(() => {
    if (!targetBarberId || !user) return null;
    return query(
      collection(db, 'barberProfiles', targetBarberId, 'appointments'),
      where('clientId', '==', user.uid)
    );
  }, [db, targetBarberId, user]);

  // Serviços da Barbearia
  const servicesQuery = useMemoFirebase(() => {
    if (!targetBarberId) return null;
    return collection(db, 'barberProfiles', targetBarberId, 'services');
  }, [db, targetBarberId]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);

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
          <h1 className="text-3xl md:text-4xl font-black font-headline text-primary">Olá, {user?.displayName?.split(' ')[0] || 'Cliente'}!</h1>
          <p className="text-muted-foreground">Bem-vindo à sua área de estilo Skull Barber.</p>
        </div>

        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-xl shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" /> Marcar Horário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Agendar Atendimento</DialogTitle>
              <DialogDescription>Escolha o melhor momento para o seu visual.</DialogDescription>
            </DialogHeader>
            <BookingForm onSuccess={() => setIsBookingOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Meus Agendamentos */}
        <Card className="border-none bg-card shadow-2xl border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Meus Agendamentos
            </CardTitle>
            <CardDescription>Acompanhe o status dos seus pedidos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments && appointments.length > 0 ? (
              appointments.sort((a,b) => b.date.localeCompare(a.date)).map((appt) => {
                const service = services?.find(s => s.id === appt.serviceId);
                const isCompleted = appt.status === 'completed';

                return (
                  <div key={appt.id} className="p-4 rounded-xl bg-secondary/20 border border-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{service?.name || 'Serviço'}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(appt.date + 'T00:00:00'), 'dd/MM/yyyy')} às {appt.time}
                      </div>
                    </div>
                    <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-500" : ""}>
                      {isCompleted ? 'Concluído' : 'Agendado'}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-muted-foreground italic text-sm bg-secondary/10 rounded-xl border border-dashed border-border">
                Nenhum agendamento encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catálogo de Serviços */}
        <Card className="border-none bg-card shadow-2xl border-t-4 border-t-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="h-5 w-5 text-accent" />
              Nossos Serviços
            </CardTitle>
            <CardDescription>O melhor da cutelaria para você.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services && services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/10 transition-colors">
                  <div>
                    <p className="font-bold text-sm">{service.name}</p>
                    <p className="text-[10px] text-muted-foreground">{service.durationMinutes} min de puro cuidado</p>
                  </div>
                  <span className="font-black text-accent text-sm">R$ {Number(service.price).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-muted-foreground italic text-sm">Aguardando catálogo...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
        <h2 className="text-2xl font-bold font-headline">Dúvidas ou Suporte?</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Caso precise alterar seu horário ou falar com um barbeiro, entre em contato pelo nosso WhatsApp.
        </p>
        <Button variant="outline" className="border-primary/30 text-primary rounded-full px-8 h-12">
          <Phone className="mr-2 h-4 w-4" /> (11) 99999-9999
        </Button>
      </div>
    </div>
  );
}
