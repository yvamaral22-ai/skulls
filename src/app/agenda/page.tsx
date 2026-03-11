
'use client';

import * as React from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Loader2, Scissors, User as UserIcon, Clock, Pencil
} from 'lucide-react';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { ptBR } from 'date-fns/locale';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AgendaPage() {
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);
  const barberShopId = "master-barbershop";

  // Gerar dias da semana atual
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const appointmentsQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'appointments'), [db]);
  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'services'), [db]);
  const staffQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'staff'), [db]);

  const { data: appointments, isLoading } = useCollection(appointmentsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: staff } = useCollection(staffQuery);

  const dailyAppointments = React.useMemo(() => {
    if (!appointments) return [];
    const targetStr = format(selectedDate, 'yyyy-MM-dd');
    return appointments
      .filter(a => a.date === targetStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, appointments]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este agendamento?')) {
      await deleteDoc(doc(db, 'barberProfiles', barberShopId, 'appointments', id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary">Agenda Semanal</h1>
          <p className="text-muted-foreground">Gerencie seus horários com visão clara da semana.</p>
        </div>

        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 md:h-11 font-bold shadow-lg shadow-primary/20 bg-primary">
              <Plus className="mr-2 h-5 w-5" /> Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] z-[10000]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento Manual</DialogTitle>
              <DialogDescription>Insira os dados do cliente e horário.</DialogDescription>
            </DialogHeader>
            <BookingForm onSuccess={() => setIsBookingOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {/* Navegação de Calendário Semanal (Estilo Google) */}
      <Card className="border-none shadow-xl bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-secondary/10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold uppercase tracking-tight">
              {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border/50">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center justify-center py-4 transition-all hover:bg-primary/5 border-r border-border/20 last:border-r-0",
                    isSelected ? "bg-primary/10 border-b-2 border-b-primary" : ""
                  )}
                >
                  <span className="text-[10px] uppercase font-bold opacity-60 mb-1">
                    {format(day, 'eee', { locale: ptBR })}
                  </span>
                  <span className={cn(
                    "text-xl font-black h-10 w-10 flex items-center justify-center rounded-full transition-colors",
                    isToday ? "bg-primary text-white" : "",
                    isSelected && !isToday ? "text-primary border-2 border-primary" : ""
                  )}>
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Planilha Diária (Daily View) */}
      <Card className="border-none shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Planilha de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
            <CardDescription>{dailyAppointments.length} horários ocupados para este dia.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-secondary/20">
                <TableRow className="border-border">
                  <TableHead className="w-[100px] font-bold">Horário</TableHead>
                  <TableHead className="font-bold">Cliente</TableHead>
                  <TableHead className="font-bold">Serviço</TableHead>
                  <TableHead className="font-bold">Barbeiro</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyAppointments.length > 0 ? (
                  dailyAppointments.map((appt) => {
                    const service = services?.find(s => s.id === appt.serviceId);
                    const barber = staff?.find(s => s.id === appt.staffId);
                    const isCompleted = appt.status === 'completed';

                    return (
                      <TableRow 
                        key={appt.id} 
                        className="border-border hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => setEditingAppointment(appt)}
                      >
                        <TableCell className="font-black text-primary">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 opacity-50" />
                            {appt.time}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-3 w-3 opacity-50" />
                            {appt.clientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Scissors className="h-3 w-3 opacity-50" />
                            {service?.name || 'Serviço'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{barber?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={isCompleted ? "default" : "secondary"} className={cn(isCompleted ? "bg-green-500 text-white" : "")}>
                            {isCompleted ? 'Finalizado' : 'Agendado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {!isCompleted && (
                            <CheckoutDialog 
                              appointmentId={appt.id}
                              customerName={appt.clientName}
                              serviceName={service?.name || 'Serviço'}
                              price={appt.priceAtAppointment || service?.price || 0}
                              staffId={appt.staffId}
                              onSuccess={() => {}}
                            />
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10" 
                            onClick={(e) => handleDelete(e, appt.id)}
                          >
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                      Nenhum agendamento para este dia. Clique em "Novo Registro" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-[450px] z-[10000]">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>Altere as informações do atendimento selecionado.</DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <BookingForm 
              initialData={editingAppointment} 
              onSuccess={() => setEditingAppointment(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
