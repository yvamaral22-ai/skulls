'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Clock, User, Scissors, CalendarDays, Loader2, 
  CheckCircle2, History as HistoryIcon, Pencil, Trash2, Briefcase 
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

export default function AgendaPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);

  const barberProfileId = user?.uid;

  const appointmentsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'appointments');
  }, [db, barberProfileId]);

  const servicesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'services');
  }, [db, barberProfileId]);

  const clientsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'clients');
  }, [db, barberProfileId]);

  const staffQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'staff');
  }, [db, barberProfileId]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);
  const { data: clients, isLoading: isClientsLoading } = useCollection(clientsQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

  const filteredAppointments = React.useMemo(() => {
    if (!date || !appointments) return [];
    const targetDateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(appt => appt.date === targetDateStr);
  }, [date, appointments]);

  const daysWithAppointments = React.useMemo(() => {
    if (!appointments) return [];
    const scheduledOnly = appointments.filter(a => a.status === 'scheduled');
    const uniqueDates = Array.from(new Set(scheduledOnly.map(a => a.date)));
    return uniqueDates.map(dateStr => parseISO(`${dateStr}T00:00:00`));
  }, [appointments]);

  const handleDelete = (apptId: string) => {
    if (!user) return;
    const apptRef = doc(db, 'barberProfiles', user.uid, 'appointments', apptId);
    deleteDocumentNonBlocking(apptRef);
    toast({
      variant: 'destructive',
      title: 'Agendamento Removido',
      description: 'O horário foi excluído da sua agenda.',
    });
  };

  if (isAuthLoading || isApptsLoading || isServicesLoading || isClientsLoading || isStaffLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Sincronizando sua agenda...</p>
        </div>
      </div>
    );
  }

  const renderAppointmentCard = (appt: any) => {
    const client = clients?.find(c => c.id === appt.clientId);
    const service = services?.find(s => s.id === appt.serviceId);
    const isCompleted = appt.status === 'completed';

    return (
      <div key={appt.id} className="group relative animate-in fade-in slide-in-from-left-2 duration-300">
        <div className={cn(
          "flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border transition-all duration-300",
          isCompleted 
            ? "bg-green-500/5 border-green-500/20" 
            : "bg-secondary/20 border-border/50 hover:bg-secondary/40 hover:border-primary/30"
        )}>
          <div className="flex flex-row md:flex-col items-center justify-center min-w-[60px] py-1 border-b md:border-b-0 md:border-r border-border gap-2 md:gap-0">
            <Clock className="h-3 w-3 text-primary" />
            <span className="font-bold text-base">{appt.time}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <User className="h-3 w-3 text-accent" />
              <h3 className="font-bold text-md">{client?.name || 'Cliente'}</h3>
              {isCompleted && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[9px] h-4">
                  FINALIZADO
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{service?.name || 'Serviço'}</span>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
            <span className="text-md font-bold text-primary">R$ {(Number(appt.priceAtAppointment) || Number(service?.price) || 0).toFixed(2)}</span>
            <div className="flex gap-1">
              {!isCompleted ? (
                <>
                  <CheckoutDialog 
                    appointmentId={appt.id}
                    customerName={client?.name || 'Cliente'}
                    serviceName={service?.name || 'Serviço'}
                    price={Number(appt.priceAtAppointment) || Number(service?.price) || 0}
                    staffId={appt.staffId}
                  />
                  
                  <Dialog open={editingAppointment?.id === appt.id} onOpenChange={(open) => setEditingAppointment(open ? appt : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 border-primary/30 text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                          <Pencil className="h-6 w-6 text-primary" />
                          Editar Agendamento
                        </DialogTitle>
                        <DialogDescription>Altere o horário, profissional ou serviço.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <BookingForm initialData={appt} onSuccess={() => setEditingAppointment(null)} />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Agendamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O horário de {client?.name} será liberado na sua agenda.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary">Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(appt.id)} className="bg-destructive text-white hover:bg-destructive/90">
                          Sim, Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <Badge variant="secondary" className="bg-primary/10 text-primary px-2 py-0.5 text-[10px]">Concluído</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStaffAgenda = (type: 'active' | 'history') => {
    if (!staff || staff.length === 0) {
      return (
        <div className="py-24 text-center flex flex-col items-center gap-4 border-2 border-dashed border-border rounded-3xl opacity-60">
          <Briefcase className="h-12 w-12 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground italic">Nenhum barbeiro cadastrado para gerenciar a agenda.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {staff.map((member) => {
          const memberAppts = filteredAppointments.filter(a => 
            a.staffId === member.id && 
            (type === 'active' ? a.status === 'scheduled' : a.status === 'completed')
          ).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

          return (
            <div key={member.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h3 className="font-headline text-lg font-bold">{member.name}</h3>
                <Badge variant="secondary" className="ml-auto bg-secondary text-muted-foreground text-[10px]">
                  {memberAppts.length} {type === 'active' ? 'agendados' : 'finalizados'}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {memberAppts.length > 0 ? (
                  memberAppts.map(renderAppointmentCard)
                ) : (
                  <p className="text-xs text-muted-foreground italic pl-10">Sem horários para este profissional.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Skull Barber - Agenda</h1>
            <p className="text-muted-foreground">Gerencie seus horários organizados por profissional.</p>
          </div>
          
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 px-8">
                <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  Agendar Cliente
                </DialogTitle>
                <DialogDescription>
                  Selecione o profissional, serviço e horário desejado.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <BookingForm onSuccess={() => setIsBookingOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 calendar-custom">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              locale={ptBR}
              className="rounded-md border-none w-full"
              modifiers={{
                hasAppointment: daysWithAppointments
              }}
              modifiersClassNames={{
                hasAppointment: 'has-appointment'
              }}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="text-sm text-muted-foreground">Agendados:</span>
              <span className="font-bold">{filteredAppointments.filter(a => a.status === 'scheduled').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-sm text-green-500">Finalizados:</span>
              <span className="font-bold text-green-500">{filteredAppointments.filter(a => a.status === 'completed').length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <Card className="border-none shadow-xl bg-card h-full min-h-[400px]">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
            </CardTitle>
            <CardDescription>{filteredAppointments.length} atendimentos totais hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/30 mb-6 h-12 p-1">
                <TabsTrigger value="active" className="flex items-center gap-2 text-sm font-bold">
                  <CalendarDays className="h-4 w-4" />
                  Agenda Ativa
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2 text-sm font-bold">
                  <HistoryIcon className="h-4 w-4" />
                  Finalizados
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                {renderStaffAgenda('active')}
              </TabsContent>

              <TabsContent value="history">
                {renderStaffAgenda('history')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
