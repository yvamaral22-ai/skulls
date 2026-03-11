
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
  Plus, ChevronLeft, ChevronRight, 
  Loader2, Search, Settings, HelpCircle, 
  CheckCircle2, Clock
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { 
  format, addDays, startOfWeek, isSameDay, 
  startOfDay, addMinutes, differenceInMinutes,
  isWithinInterval, endOfDay, parse
} from 'date-fns';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 às 21:00
const COLUMN_WIDTH = "min-w-[120px]";

export default function AgendaPage() {
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  const barberShopId = "master-barbershop";

  // Atualiza a linha de "agora" a cada minuto
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
    const [hours, minutes] = appt.time.split(':').map(Number);
    const startMinutes = (hours - 8) * 60 + minutes;
    const duration = service?.durationMinutes || 30;
    
    return {
      top: `${(startMinutes / 60) * 80}px`, // 80px por hora
      height: `${(duration / 60) * 80}px`,
    };
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este agendamento?')) {
      await deleteDoc(doc(db, 'barberProfiles', barberShopId, 'appointments', id));
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
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-background">
      {/* Cabeçalho Estilo Google Calendar */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-6">
            <div className="p-2 bg-primary rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold hidden md:block">Agenda Mestre</h1>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} className="font-bold">Hoje</Button>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <h2 className="text-xl font-medium ml-2">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Search className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="hidden md:flex"><HelpCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="hidden md:flex"><Settings className="h-5 w-5" /></Button>
          <div className="h-8 w-px bg-border mx-2 hidden md:block" />
          <Button className="bg-primary text-white font-bold" onClick={() => setIsBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo
          </Button>
        </div>
      </header>

      {/* Grade de Horários */}
      <div className="flex flex-1 overflow-hidden">
        {/* Eixo de Horários (Fixo) */}
        <div className="w-16 flex-none bg-card border-r border-border flex flex-col pt-[80px]">
          {HOURS.map(hour => (
            <div key={hour} className="h-20 text-[10px] text-muted-foreground text-center pt-2">
              {`${hour}:00`}
            </div>
          ))}
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-auto relative">
          <div className="inline-flex min-w-full">
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const dayAppts = appointments?.filter(a => a.date === format(day, 'yyyy-MM-dd')) || [];

              return (
                <div key={dayIdx} className={cn("flex-1 relative border-r border-border last:border-r-0", COLUMN_WIDTH)}>
                  {/* Cabeçalho do Dia */}
                  <div className={cn(
                    "sticky top-0 z-20 h-20 flex flex-col items-center justify-center border-b border-border bg-card/80 backdrop-blur-sm transition-colors",
                    isToday ? "text-primary" : ""
                  )}>
                    <span className="text-[10px] uppercase font-bold opacity-60">
                      {format(day, 'eee', { locale: ptBR })}
                    </span>
                    <span className={cn(
                      "text-2xl font-black h-12 w-12 flex items-center justify-center rounded-full transition-colors mt-1",
                      isToday ? "bg-primary text-white shadow-lg shadow-primary/30" : ""
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Células de Hora */}
                  <div className="relative" style={{ height: `${HOURS.length * 80}px` }}>
                    {HOURS.map(hour => (
                      <div 
                        key={hour} 
                        className="h-20 border-b border-border/30 hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => handleCellClick(day, hour)}
                      />
                    ))}

                    {/* Agendamentos */}
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
                            "absolute left-1 right-1 rounded-md p-2 text-[10px] overflow-hidden transition-all border shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] z-10",
                            isCompleted 
                              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" 
                              : "bg-primary/10 border-primary/30 text-primary-foreground"
                          )}
                        >
                          <div className="font-bold truncate uppercase">{appt.clientName}</div>
                          <div className="opacity-80 truncate">{service?.name || 'Serviço'}</div>
                          {isCompleted && <CheckCircle2 className="absolute bottom-1 right-1 h-3 w-3 text-green-500" />}
                        </div>
                      );
                    })}

                    {/* Linha de Hora Atual */}
                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                        style={{ 
                          top: `${((differenceInMinutes(currentTime, startOfDay(currentTime)) - 480) / 60) * 80}px` 
                        }}
                      >
                        <div className="h-2 w-2 rounded-full bg-red-500 -ml-1" />
                        <div className="h-px flex-1 bg-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modais */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[450px] z-[10000]">
          <DialogHeader>
            <DialogTitle>Novo Registro</DialogTitle>
            <DialogDescription>Agende um novo atendimento.</DialogDescription>
          </DialogHeader>
          <BookingForm onSuccess={() => setIsBookingOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-[450px] z-[10000]">
          <DialogHeader>
            <DialogTitle>{editingAppointment?.id ? 'Editar Atendimento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Confirme os detalhes do horário.</DialogDescription>
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
                  <Button 
                    variant="ghost" 
                    className="flex-1 text-destructive hover:bg-destructive/10" 
                    onClick={(e) => handleDelete(e, editingAppointment.id)}
                  >
                    Excluir Agendamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
