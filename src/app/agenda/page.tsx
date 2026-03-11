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
  Loader2, Search, CheckCircle2, Clock, Trash2
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { 
  format, addDays, startOfWeek, isSameDay, 
  startOfDay, differenceInMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 às 21:00
const COLUMN_WIDTH = "min-w-[150px] md:min-w-[120px]";

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

  const { data: appointments, isLoading } = useCollection(appointmentsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: staff } = useCollection(staffQuery);

  const getAppointmentStyle = (appt: any, service: any) => {
    if (!appt.time) return { top: '0px', height: '40px' };
    const [hours, minutes] = appt.time.split(':').map(Number);
    const startMinutes = (hours - 8) * 60 + (minutes || 0);
    const duration = service?.durationMinutes || 30;
    
    return {
      top: `${(startMinutes / 60) * 80}px`, 
      height: `${(duration / 60) * 80}px`,
    };
  };

  const handleDelete = (id: string) => {
    const apptRef = doc(db, 'barberProfiles', barberShopId, 'appointments', id);
    deleteDocumentNonBlocking(apptRef);
    setEditingAppointment(null);
    toast({
      variant: "destructive",
      title: "Registro Eliminado",
      description: "O agendamento foi removido da grade tática.",
    });
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
      {/* Cabeçalho */}
      <header className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-card gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} className="font-bold h-9">Hoje</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-sm md:text-lg font-bold ml-2 capitalize">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button className="flex-1 sm:flex-none bg-primary text-black font-bold h-9" onClick={() => setIsBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo
          </Button>
        </div>
      </header>

      {/* Grade */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-12 md:w-16 flex-none bg-card border-r border-border flex flex-col pt-[80px]">
          {HOURS.map(hour => (
            <div key={hour} className="h-20 text-[9px] md:text-[10px] text-muted-foreground text-center pt-2 font-bold opacity-50">
              {`${hour}:00`}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto relative">
          <div className="inline-flex min-w-full">
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointments?.filter(a => a.date === dateStr) || [];

              return (
                <div key={dayIdx} className={cn("flex-1 relative border-r border-border last:border-r-0", COLUMN_WIDTH)}>
                  <div className={cn(
                    "sticky top-0 z-20 h-20 flex flex-col items-center justify-center border-b border-border bg-card/90 backdrop-blur-md transition-colors",
                    isToday ? "text-primary" : ""
                  )}>
                    <span className="text-[9px] uppercase font-black opacity-40">
                      {format(day, 'eee', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-xl font-black h-10 w-10 flex items-center justify-center rounded-full transition-colors mt-0.5",
                      isToday ? "bg-primary text-black shadow-lg shadow-primary/30" : ""
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="relative" style={{ height: `${HOURS.length * 80}px` }}>
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="h-20 border-b border-border/10 hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => handleCellClick(day, hour)}
                      />
                    ))}

                    {dayAppts.map(appt => {
                      const service = services?.find(s => s.id === appt.serviceId);
                      const isCompleted = appt.status === 'completed';
                      const style = getAppointmentStyle(appt, service);

                      return (
                        <div
                          key={appt.id}
                          style={style}
                          onClick={(e) => { e.stopPropagation(); setEditingAppointment(appt); }}
                          className={cn(
                            "absolute left-1 right-1 rounded-lg p-2 text-[9px] md:text-[10px] overflow-hidden transition-all border shadow-md cursor-pointer hover:shadow-xl hover:scale-[1.01] z-10 flex flex-col justify-center",
                            isCompleted 
                              ? "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300" 
                              : "bg-primary/20 border-primary/40 text-primary-foreground"
                          )}
                        >
                          <div className="font-black truncate uppercase leading-tight">{appt.clientName}</div>
                          <div className="opacity-70 truncate font-bold">{service?.name || 'Serviço'}</div>
                          {isCompleted && <CheckCircle2 className="absolute top-1 right-1 h-3 w-3 text-green-500" />}
                        </div>
                      );
                    })}

                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                        style={{ 
                          top: `${((differenceInMinutes(currentTime, startOfDay(currentTime)) - 480) / 60) * 80}px` 
                        }}
                      >
                        <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-glow shadow-red-500" />
                        <div className="h-px flex-1 bg-red-500/50" />
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
            <DialogDescription>Agende um novo atendimento.</DialogDescription>
          </DialogHeader>
          <BookingForm onSuccess={() => setIsBookingOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingAppointment?.id ? 'Detalhes do Atendimento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Gerencie as informações do horário.</DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-6">
              <BookingForm 
                initialData={editingAppointment} 
                onSuccess={() => setEditingAppointment(null)} 
              />
              
              {editingAppointment.id && (
                <div className="flex gap-2 pt-4 border-t">
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
                        className="flex-1 text-destructive hover:bg-destructive/10 font-bold"
                      >
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-destructive/20 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-2xl text-destructive uppercase tracking-widest">Remover Registro?</AlertDialogTitle>
                        <AlertDialogDescription className="uppercase tracking-tighter text-[10px]">
                          Esta operação removerá permanentemente o agendamento de {editingAppointment.clientName} do arsenal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary uppercase text-[10px] font-bold">Abortar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(editingAppointment.id)} 
                          className="bg-destructive text-white hover:bg-destructive/90 uppercase text-[10px] font-bold"
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
