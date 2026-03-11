
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { 
  Plus, ChevronLeft, ChevronRight, 
  Loader2, CheckCircle2, Clock, User, Calendar as CalendarIcon
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { 
  format, addDays, startOfWeek, isSameDay, 
  startOfDay, differenceInMinutes, parseISO
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 às 21:00
const SLOT_HEIGHT = 80;
const COLUMN_WIDTH = "min-w-[160px] md:min-w-[180px]";

export default function AgendaPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  const barberShopId = "master-barbershop";

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const appointmentsQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'appointments'), [db]);
  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'services'), [db]);
  const staffQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'staff'), [db]);

  const { data: appointments, isLoading: isLoading } = useCollection(appointmentsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: staff } = useCollection(staffQuery);

  const getAppointmentStyle = (appt: any, service: any) => {
    if (!appt.time) return { top: '0px', height: '40px' };
    
    const [hours, minutes] = appt.time.split(':').map(Number);
    // 8:00 é o ponto zero
    const relativeMinutes = (hours - 8) * 60 + (minutes || 0);
    const duration = Math.max(Number(service?.durationMinutes) || 30, 30);
    
    return {
      top: `${(relativeMinutes / 60) * SLOT_HEIGHT}px`, 
      height: `${(duration / 60) * SLOT_HEIGHT}px`,
    };
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'barberProfiles', barberShopId, 'appointments', id));
      setEditingAppointment(null);
      toast({
        variant: "destructive",
        title: "Agendamento Excluído",
        description: "O horário foi removido da agenda.",
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const handleCellClick = (day: Date, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setEditingAppointment({ date: format(day, 'yyyy-MM-dd'), time: timeStr });
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden bg-background rounded-2xl border border-border shadow-2xl">
      {/* Header Fixo */}
      <header className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-card gap-4 z-50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} className="font-bold h-9 bg-secondary/50">Hoje</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-sm md:text-lg font-bold ml-2 capitalize text-primary font-headline tracking-widest">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button className="flex-1 sm:flex-none bg-primary text-black font-bold h-10 shadow-lg shadow-primary/20" onClick={() => setIsBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Horário
          </Button>
        </div>
      </header>

      {/* Grade de Agenda */}
      <div className="flex flex-1 overflow-hidden">
        {/* Coluna de Horários Fixa */}
        <div className="w-16 md:w-20 flex-none bg-card border-r border-border flex flex-col pt-[80px]">
          {HOURS.map(hour => (
            <div key={hour} className="h-20 flex items-start justify-center pt-2">
              <span className="text-[10px] md:text-xs font-medium text-muted-foreground font-body">
                {`${hour.toString().padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* Área de Scroll da Grade */}
        <div className="flex-1 overflow-auto relative">
          <div className="inline-flex min-w-full">
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointments?.filter(a => a.date === dateStr) || [];

              return (
                <div key={dayIdx} className={cn("flex-1 relative border-r border-border last:border-r-0", COLUMN_WIDTH)}>
                  {/* Cabeçalho da Coluna (Dia) */}
                  <div className={cn(
                    "sticky top-0 z-40 h-20 flex flex-col items-center justify-center border-b border-border bg-card/95 backdrop-blur-md",
                    isToday ? "text-primary" : ""
                  )}>
                    <span className="text-[10px] uppercase font-bold opacity-60 font-body">
                      {format(day, 'eee', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-xl font-black h-10 w-10 flex items-center justify-center rounded-full mt-0.5 font-body",
                      isToday ? "bg-primary text-black shadow-lg shadow-primary/30" : ""
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Espaço dos Slots */}
                  <div className="relative" style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}>
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="h-20 border-b border-border/5 hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => handleCellClick(day, hour)}
                      >
                        <div className="hidden group-hover:block absolute ml-2 mt-2 text-[8px] text-primary/40 font-bold uppercase">Disponível</div>
                      </div>
                    ))}

                    {/* Renderização dos Agendamentos */}
                    {dayAppts.map(appt => {
                      const service = services?.find(s => s.id === appt.serviceId);
                      const barber = staff?.find(s => s.id === appt.staffId);
                      const isCompleted = appt.status === 'completed';
                      const style = getAppointmentStyle(appt, service);

                      return (
                        <div
                          key={appt.id}
                          style={style}
                          onClick={(e) => { e.stopPropagation(); setEditingAppointment(appt); }}
                          className={cn(
                            "absolute left-1.5 right-1.5 rounded-xl p-3 text-xs overflow-hidden transition-all border shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] z-30 flex flex-col justify-start gap-1 font-body",
                            isCompleted 
                              ? "bg-green-500/10 border-green-500/30 text-green-400" 
                              : "bg-primary/10 border-primary/30 text-primary-foreground"
                          )}
                        >
                          <div className="font-black truncate uppercase tracking-tight text-white leading-none">
                            {appt.clientName || 'Cliente'}
                          </div>
                          
                          <div className="flex flex-col gap-0.5 opacity-80 font-medium text-[10px] md:text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-primary" /> {appt.time} - {service?.name || 'Corte'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-primary/60" /> {barber?.name || 'Profissional'}
                            </div>
                          </div>

                          {isCompleted && (
                            <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-black">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Linha do Tempo Atual */}
                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 z-50 flex items-center pointer-events-none"
                        style={{ 
                          top: `${((differenceInMinutes(currentTime, startOfDay(currentTime)) - 480) / 60) * SLOT_HEIGHT}px` 
                        }}
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1 shadow-glow shadow-red-500" />
                        <div className="h-px flex-1 bg-red-500/60" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">Novo Agendamento</DialogTitle>
            <DialogDescription className="font-body text-xs uppercase opacity-60">Preencha os dados do cliente e horário.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <BookingForm onSuccess={() => setIsBookingOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Edição/Detalhes */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">{editingAppointment?.id ? 'Detalhes do Horário' : 'Marcar Horário'}</DialogTitle>
            <DialogDescription className="font-body text-xs uppercase opacity-60">Gerencie este agendamento.</DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-6">
              <div className="max-h-[60vh] overflow-y-auto px-1">
                <BookingForm 
                  initialData={editingAppointment} 
                  onSuccess={() => setEditingAppointment(null)} 
                />
              </div>
              
              {editingAppointment.id && (
                <div className="flex gap-3 pt-6 border-t border-border/50">
                  {editingAppointment.status !== 'completed' && (
                    <CheckoutDialog 
                      appointmentId={editingAppointment.id}
                      customerName={editingAppointment.clientName}
                      serviceName={services?.find(s => s.id === editingAppointment.serviceId)?.name || 'Serviço'}
                      price={editingAppointment.priceAtAppointment || 0}
                      staffId={editingAppointment.staffId}
                      onSuccess={() => setEditingAppointment(null)}
                    />
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex-1 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] font-body"
                      >
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-2xl text-destructive uppercase">Excluir Registro?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-sm">
                          Esta operação removerá o agendamento permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary font-bold font-body">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(editingAppointment.id)} 
                          className="bg-destructive text-white hover:bg-destructive/90 font-bold font-body"
                        >
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
