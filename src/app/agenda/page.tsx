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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Clock, User, Scissors, CalendarDays, Loader2, 
  History as HistoryIcon, Briefcase, Menu, Pencil, Trash2
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function AgendaPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [editingAppt, setEditingAppt] = React.useState<any | null>(null);

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
  const { data: services } = useCollection(servicesQuery);
  const { data: clients } = useCollection(clientsQuery);
  const { data: staff } = useCollection(staffQuery);

  const filteredAppointments = React.useMemo(() => {
    if (!date || !appointments) return [];
    const targetDateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(appt => appt.date === targetDateStr);
  }, [date, appointments]);

  const handleDelete = (apptId: string) => {
    if (!barberProfileId) return;
    const apptRef = doc(db, 'barberProfiles', barberProfileId, 'appointments', apptId);
    deleteDocumentNonBlocking(apptRef);
    toast({
      variant: "destructive",
      title: "Agendamento Removido",
      description: "O horário foi excluído com sucesso.",
    });
  };

  if (isAuthLoading || isApptsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const renderAppointmentCard = (appt: any) => {
    const client = clients?.find(c => c.id === appt.clientId);
    const service = services?.find(s => s.id === appt.serviceId);
    const isCompleted = appt.status === 'completed';

    return (
      <div key={appt.id} className={cn(
        "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border transition-all",
        isCompleted ? "bg-green-500/5 border-green-500/20" : "bg-secondary/20 border-border/50"
      )}>
        <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border pr-2 md:pr-4">
          <span className="font-bold text-sm md:text-base">{appt.time}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <h3 className="font-bold text-sm md:text-md truncate">{client?.name || 'Cliente'}</h3>
            {isCompleted && <Badge className="bg-green-500 text-[8px] h-4">OK</Badge>}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{service?.name || 'Serviço'}</p>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {!isCompleted && (
            <>
              <CheckoutDialog 
                appointmentId={appt.id}
                customerName={client?.name || 'Cliente'}
                serviceName={service?.name || 'Serviço'}
                price={Number(appt.priceAtAppointment) || Number(service?.price) || 0}
                staffId={appt.staffId}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingAppt(appt)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(appt.id)} className="bg-destructive text-white">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStaffAgenda = (type: 'active' | 'history') => {
    if (!staff || staff.length === 0) return <p className="text-center py-10 opacity-50 italic">Nenhum barbeiro cadastrado.</p>;

    return (
      <div className="space-y-6">
        {staff.map((member) => {
          const memberAppts = filteredAppointments.filter(a => 
            a.staffId === member.id && (type === 'active' ? a.status === 'scheduled' : a.status === 'completed')
          ).sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div key={member.id} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="font-bold text-primary flex items-center gap-2 text-sm md:text-base">
                  <Briefcase className="h-4 w-4" /> {member.name}
                </h3>
                <Badge variant="secondary" className="text-[10px]">{memberAppts.length} horários</Badge>
              </div>
              <div className="grid gap-2">
                {memberAppts.length > 0 ? memberAppts.map(renderAppointmentCard) : (
                  <p className="text-[10px] text-muted-foreground italic pl-6">Livre para agendamentos.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarTrigger>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SidebarTrigger>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">Agenda Master</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Gestão de horários em tempo real.</p>
          </div>
        </div>

        <Dialog open={isBookingOpen || !!editingAppt} onOpenChange={(open) => {
          if (!open) {
            setIsBookingOpen(false);
            setEditingAppt(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto h-12 md:h-11 font-bold shadow-lg shadow-primary/20" onClick={() => setIsBookingOpen(true)}>
              <Plus className="mr-2 h-5 w-5" /> Novo Horário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editingAppt ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
              <DialogDescription>Preencha os dados para organizar sua agenda.</DialogDescription>
            </DialogHeader>
            <BookingForm 
              initialData={editingAppt ? {
                id: editingAppt.id,
                clientName: clients?.find(c => c.id === editingAppt.clientId)?.name || '',
                staffId: editingAppt.staffId,
                serviceId: editingAppt.serviceId,
                time: editingAppt.time,
                date: editingAppt.date
              } : null}
              onSuccess={() => {
                setIsBookingOpen(false);
                setEditingAppt(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="p-4 bg-primary/5">
              <CardTitle className="text-md flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                locale={ptBR}
                className="w-full"
                disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
              />
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-8">
          <Card className="border-none shadow-xl min-h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg md:text-xl font-headline">
                {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Hoje'}
              </CardTitle>
              <CardDescription>{filteredAppointments.length} atendimentos totais.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
                  <TabsTrigger value="active" className="font-bold text-xs md:text-sm">Agenda Ativa</TabsTrigger>
                  <TabsTrigger value="history" className="font-bold text-xs md:text-sm">Concluídos</TabsTrigger>
                </TabsList>
                <TabsContent value="active">{renderStaffAgenda('active')}</TabsContent>
                <TabsContent value="history">{renderStaffAgenda('history')}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
