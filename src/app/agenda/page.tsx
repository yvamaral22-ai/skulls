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
  Loader2, CheckCircle2, Clock, User, Scissors, Calendar as CalendarIcon, Info
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { 
  format, addDays, startOfWeek, isSameDay, 
  startOfDay, differenceInMinutes, parseISO, addMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const START_HOUR = 8;
const HOURS_COUNT = 15; // 08:00 às 22:00
const HOURS = Array.from({ length: HOURS_COUNT }, (_, i) => i + START_HOUR);
const SLOT_HEIGHT = 120; // Altura fixa para sincronia perfeita
const COLUMN_WIDTH = "min-w-[180px] md:min-w-[200px]"; // Ajustado para mostrar + dias

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
    if (!appt.time) return { display: 'none' };
    
    const [hours, minutes] = appt.time.split(':').map(Number);
    const minutesSinceStart = (hours - START_HOUR) * 60 + (minutes || 0);
    const durationMinutes = Math.max(Number(service?.durationMinutes) || 30, 30);
    
    const topPx = (minutesSinceStart / 60) * SLOT_HEIGHT;
    const heightPx = (durationMinutes / 60) * SLOT_HEIGHT;
    
    return {
      top: `${topPx}px`, 
      height: `${heightPx}px`,
      minHeight: '70px',
      zIndex: 30
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
      {/* Header Fixo de Topo */}
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

      {/* Grade de Agenda com Scroll Unificado */}
      <div className="flex-1 overflow-auto relative scrollbar-thin">
        <div className="inline-flex min-w-full flex-col">
          
          {/* Cabeçalho de Dias (Sticky no topo do scroll) */}
          <div className="sticky top-0 z-50 flex bg-card border-b border-border">
            {/* Canto Vazio (Sticky na esquerda e no topo) */}
            <div className="sticky left-0 z-[60] w-16 md:w-20 flex-none bg-card border-r border-border h-[120px]" />
            
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={dayIdx} className={cn(
                  "flex-1 flex flex-col items-center justify-center h-[120px] bg-card/95 backdrop-blur-md border-r border-border last:border-r-0",
                  COLUMN_WIDTH,
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
              );
            })}
          </div>

          {/* Área Principal da Grade */}
          <div className="flex">
            {/* Coluna de Horários (Sticky na esquerda do scroll) */}
            <div className="sticky left-0 z-40 w-16 md:w-20 flex-none bg-card border-r border-border flex flex-col">
              {HOURS.map(hour => (
                <div key={hour} className="h-[120px] flex items-start justify-center pt-3 border-b border-border/10 bg-card">
                  <span className="text-[11px] md:text-xs font-black text-muted-foreground font-body">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </span>
                </div>
              ))}
            </div>

            {/* Colunas de Agendamentos */}
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointments?.filter(a => a.date === dateStr) || [];

              return (
                <div key={dayIdx} className={cn("flex-1 relative border-r border-border last:border-r-0", COLUMN_WIDTH)}>
                  
                  {/* Espaço dos Slots de Horário */}
                  <div className="relative bg-background/20" style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}>
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="h-[120px] border-b border-border/5 hover:bg-primary/5 transition-colors cursor-pointer group"
                        onClick={() => handleCellClick(day, hour)}
                      >
                        <div className="hidden group-hover:block absolute ml-2 mt-2 text-[8px] text-primary/40 font-bold uppercase tracking-widest">Livre</div>
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
                            "absolute left-1.5 right-1.5 rounded-xl p-3 text-xs overflow-hidden transition-all border shadow-lg cursor-pointer hover:shadow-2xl hover:scale-[1.01] flex flex-col justify-between font-body",
                            isCompleted 
                              ? "bg-green-600/30 border-green-500/50 text-green-100" 
                              : "bg-primary/10 border-primary/30 text-white"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="font-black uppercase text-[12px] md:text-[14px] tracking-tight text-white leading-none truncate">
                              {appt.clientName || 'Cliente'}
                            </div>
                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold truncate">
                              <Scissors className="h-3 w-3 shrink-0" /> {service?.name || 'Serviço'}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-0.5 mt-2 border-t border-white/5 pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                              <Clock className="h-3 w-3 shrink-0 text-primary" /> {appt.time} • {service?.durationMinutes} min
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/70">
                              <User className="h-3 w-3 shrink-0 text-primary" /> {barber?.name || 'Barbeiro'}
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

                    {/* Indicador de Hora Atual */}
                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 z-40 flex items-center pointer-events-none"
                        style={{ 
                          top: `${((differenceInMinutes(currentTime, startOfDay(currentTime)) - (START_HOUR * 60)) / 60) * SLOT_HEIGHT}px` 
                        }}
                      >
                        <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 shadow-glow shadow-red-500" />
                        <div className="h-0.5 flex-1 bg-red-500/50" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modais de Gerenciamento */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">Novo Agendamento</DialogTitle>
            <DialogDescription className="font-body text-xs uppercase opacity-60">Escolha o melhor horário para o cliente.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <BookingForm onSuccess={() => setIsBookingOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">{editingAppointment?.id ? 'Detalhes do Atendimento' : 'Marcar Horário'}</DialogTitle>
            <DialogDescription className="font-body text-xs uppercase opacity-60">Gestão de horário e checkout.</DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-4">
              {editingAppointment.id && (
                <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">Cliente</h4>
                      <p className="font-headline text-2xl text-white leading-none tracking-tight">{editingAppointment.clientName}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "uppercase text-[9px] font-bold tracking-widest border-2",
                      editingAppointment.status === 'completed' ? "border-green-500/40 text-green-400" : "border-primary/20 text-primary"
                    )}>
                      {editingAppointment.status === 'completed' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                    <div className="space-y-1">
                      <h4 className="text-[10px] uppercase font-bold text-primary/60 tracking-widest flex items-center gap-1.5">
                        <Scissors className="h-3 w-3" /> Serviço
                      </h4>
                      <p className="text-sm font-black text-white truncate">
                        {services?.find(s => s.id === editingAppointment.serviceId)?.name || 'N/A'}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        Duração: {services?.find(s => s.id === editingAppointment.serviceId)?.durationMinutes || 0} min
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] uppercase font-bold text-primary/60 tracking-widest flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Horário
                      </h4>
                      <p className="text-sm font-black text-white">{editingAppointment.time}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        {format(parseISO(editingAppointment.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-h-[50vh] overflow-y-auto px-1">
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
                        className="flex-1 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px]"
                      >
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-2xl text-destructive uppercase">Excluir Agendamento?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-sm text-muted-foreground">
                          O horário de {editingAppointment.clientName} será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(editingAppointment.id)} 
                          className="bg-destructive text-white hover:bg-destructive/90 font-bold"
                        >
                          Confirmar
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
