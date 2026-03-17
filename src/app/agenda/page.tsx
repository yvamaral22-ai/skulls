'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, ChevronLeft, ChevronRight, 
  Loader2, CheckCircle2, Clock, User, Scissors, Filter
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, query, where } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { 
  format, addDays, startOfWeek, isSameDay, 
  startOfDay, differenceInMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const START_HOUR = 8;
const HOURS_COUNT = 15;
const HOURS = Array.from({ length: HOURS_COUNT }, (_, i) => i + START_HOUR);
const SLOT_HEIGHT = 120;
const COLUMN_WIDTH = "min-w-[140px] sm:min-w-[180px] md:min-w-[200px] lg:flex-1"; 

export default function AgendaPage() {
  const db = useFirestore();
  const { role, staffId: loggedStaffId, barberProfileId, isUserLoading } = useUser();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  // Filtro de profissional (Apenas para ADMIN)
  const [staffFilter, setStaffFilter] = React.useState<string>("all");

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const staffQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberProfileId, 'staff'), [db, barberProfileId]);
  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberProfileId, 'services'), [db, barberProfileId]);
  
  const { data: staff } = useCollection(staffQuery);
  const { data: services } = useCollection(servicesQuery);

  // Consulta de Agendamentos com Restrição de Role
  const appointmentsQuery = useMemoFirebase(() => {
    const baseCol = collection(db, 'barberProfiles', barberProfileId, 'appointments');
    
    // Se for Barbeiro (STAFF), vê APENAS os seus
    if (role === 'STAFF' && loggedStaffId) {
      return query(baseCol, where('staffId', '==', loggedStaffId));
    }
    
    // Se for Admin e tiver filtro de barbeiro selecionado
    if (role === 'ADMIN' && staffFilter !== 'all') {
      return query(baseCol, where('staffId', '==', staffFilter));
    }
    
    // Admin sem filtro vê todos
    return baseCol;
  }, [db, barberProfileId, role, loggedStaffId, staffFilter]);

  const { data: appointments, isLoading: isLoadingAppts } = useCollection(appointmentsQuery);

  const getAppointmentStyle = (appt: any, service: any) => {
    if (!appt.time) return { display: 'none' };
    const [hours, minutes] = appt.time.split(':').map(Number);
    const minutesSinceStart = (hours - START_HOUR) * 60 + (minutes || 0);
    const durationMinutes = Math.max(Number(service?.durationMinutes) || 30, 30);
    const topPx = (minutesSinceStart / 60) * SLOT_HEIGHT;
    const heightPx = (durationMinutes / 60) * SLOT_HEIGHT;
    return { top: `${topPx}px`, height: `${heightPx}px`, minHeight: '70px', zIndex: 30 };
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'barberProfiles', barberProfileId, 'appointments', id));
      setEditingAppointment(null);
      toast({ variant: "destructive", title: "Agendamento Excluído", description: "O horário foi removido." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  if (isUserLoading || isLoadingAppts) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] overflow-hidden bg-background rounded-2xl border border-border shadow-2xl relative">
      <header className="flex flex-col lg:flex-row items-center justify-between p-4 border-b border-border bg-card gap-4 z-50 shrink-0">
        <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} className="font-bold h-9">Hoje</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-sm md:text-lg font-bold ml-2 capitalize text-primary font-headline tracking-widest whitespace-nowrap">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-center">
          {role === 'ADMIN' && (
            <div className="flex items-center gap-2 bg-secondary/20 p-1 px-2 rounded-lg border border-border">
              <Filter className="h-4 w-4 text-primary opacity-60" />
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-[140px] md:w-[180px] h-8 bg-transparent border-none focus:ring-0 text-[10px] uppercase font-bold">
                  <SelectValue placeholder="Filtrar Barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ver Todos Barbeiros</SelectItem>
                  {staff?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {role === 'STAFF' && (
            <Badge variant="outline" className="border-primary/50 text-primary uppercase text-[9px] font-bold px-3 py-1">
              Minha Agenda: {staff?.find(s => s.id === loggedStaffId)?.name || 'Carregando...'}
            </Badge>
          )}
          
          <Button className="bg-primary text-black font-bold h-9 shadow-lg hover:bg-primary/90" onClick={() => setIsBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Horário
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto relative scrollbar-thin">
        <div className="inline-flex min-w-full flex-col">
          <div className="sticky top-0 z-50 flex bg-card border-b border-border shrink-0">
            <div className="sticky left-0 z-[60] w-14 md:w-20 flex-none bg-card border-r border-border h-20 md:h-[120px]" />
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={dayIdx} className={cn("flex-1 flex flex-col items-center justify-center h-20 md:h-[120px] bg-card/95 backdrop-blur-md border-r border-border", COLUMN_WIDTH, isToday ? "text-primary" : "")}>
                  <span className="text-[9px] md:text-[10px] uppercase font-bold opacity-60">{format(day, 'eee', { locale: ptBR })}</span>
                  <span className={cn("text-lg md:text-xl font-black h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full mt-0.5", isToday ? "bg-primary text-black shadow-lg" : "")}>
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex">
            <div className="sticky left-0 z-40 w-14 md:w-20 flex-none bg-card border-r border-border flex flex-col">
              {HOURS.map(hour => (
                <div key={hour} className="h-[120px] flex items-start justify-center pt-3 border-b border-border/10 bg-card">
                  <span className="text-[10px] md:text-xs font-black text-muted-foreground">{`${hour.toString().padStart(2, '0')}:00`}</span>
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointments?.filter(a => a.date === dateStr) || [];

              return (
                <div key={dayIdx} className={cn("flex-1 relative border-r border-border last:border-r-0", COLUMN_WIDTH)}>
                  <div className="relative bg-background/20" style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}>
                    {HOURS.map(hour => (
                      <div key={hour} className="h-[120px] border-b border-border/5 hover:bg-primary/5 transition-colors cursor-pointer group" onClick={() => setEditingAppointment({ date: dateStr, time: `${hour.toString().padStart(2, '0')}:00` })}>
                        <div className="hidden group-hover:block absolute ml-2 mt-2 text-[8px] text-primary/40 font-bold uppercase tracking-widest">Livre</div>
                      </div>
                    ))}

                    {dayAppts.map(appt => {
                      const service = services?.find(s => s.id === appt.serviceId);
                      const barber = staff?.find(s => s.id === appt.staffId);
                      const isCompleted = appt.status === 'completed';
                      return (
                        <div
                          key={appt.id}
                          style={getAppointmentStyle(appt, service)}
                          onClick={(e) => { e.stopPropagation(); setEditingAppointment(appt); }}
                          className={cn(
                            "absolute left-1 md:left-1.5 right-1 md:right-1.5 rounded-lg md:rounded-xl p-2 md:p-3 text-xs overflow-hidden transition-all border shadow-lg cursor-pointer hover:shadow-2xl flex flex-col justify-between",
                            isCompleted ? "bg-green-600/30 border-green-500/50 text-green-100" : "bg-primary/10 border-primary/30 text-white"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="font-black uppercase text-[11px] md:text-[14px] tracking-tight text-white leading-none truncate">{appt.clientName}</div>
                            <div className="flex items-center gap-1 text-primary text-[9px] md:text-[10px] font-bold truncate">
                              <Scissors className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" /> {service?.name}
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5 mt-2 border-t border-white/5 pt-1.5">
                            <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-white/90">
                              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0 text-primary" /> {appt.time}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-white/70">
                              <User className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0 text-primary" /> {barber?.name}
                            </div>
                          </div>
                          {isCompleted && <div className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-green-500 text-black"><CheckCircle2 className="h-3 w-3" /></div>}
                        </div>
                      );
                    })}

                    {isToday && (
                      <div className="absolute left-0 right-0 z-40 flex items-center pointer-events-none" style={{ top: `${((differenceInMinutes(currentTime, startOfDay(currentTime)) - (START_HOUR * 60)) / 60) * SLOT_HEIGHT}px` }}>
                        <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-glow shadow-red-500" />
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

      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="w-[95vw] max-w-[450px]">
          <DialogHeader><DialogTitle className="font-headline text-xl text-primary">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto"><BookingForm onSuccess={() => setIsBookingOpen(false)} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="w-[95vw] max-w-[450px]">
          <DialogHeader><DialogTitle className="font-headline text-xl text-primary">{editingAppointment?.id ? 'Detalhes' : 'Novo'}</DialogTitle></DialogHeader>
          {editingAppointment && (
            <div className="space-y-4">
              {editingAppointment.id && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[9px] uppercase font-bold text-primary/60">Cliente</h4>
                      <p className="font-headline text-xl text-white">{editingAppointment.clientName}</p>
                    </div>
                    <Badge variant="outline" className={cn("uppercase text-[8px] font-bold", editingAppointment.status === 'completed' ? "border-green-500 text-green-400" : "text-primary")}>
                      {editingAppointment.status === 'completed' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              )}
              <div className="max-h-[40vh] overflow-y-auto"><BookingForm initialData={editingAppointment} onSuccess={() => setEditingAppointment(null)} /></div>
              {editingAppointment.id && (
                <div className="flex gap-2 pt-4 border-t border-border/50">
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
                  <Button variant="ghost" onClick={() => handleDelete(editingAppointment.id)} className="flex-1 text-destructive hover:bg-destructive/10 font-bold uppercase text-[9px]">Excluir</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
