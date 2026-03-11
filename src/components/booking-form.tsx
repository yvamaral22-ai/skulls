'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

const bookingSchema = z.object({
  clientName: z.string().min(2, 'Informe o nome do cliente'),
  staffId: z.string().min(1, 'Selecione um barbeiro'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  date: z.date({
    required_error: 'Selecione uma data',
  }),
  time: z.string().min(1, 'Selecione um horário'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const barberProfileId = user?.uid || 'loading';

  const servicesQuery = useMemoFirebase(() => {
    if (barberProfileId === 'loading') return null;
    return collection(db, 'barberProfiles', barberProfileId, 'services');
  }, [db, barberProfileId]);

  const staffQuery = useMemoFirebase(() => {
    if (barberProfileId === 'loading') return null;
    return collection(db, 'barberProfiles', barberProfileId, 'staff');
  }, [db, barberProfileId]);

  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: '',
      staffId: '',
      serviceId: '',
      time: '09:00',
      date: new Date(),
    },
  });

  const selectedServiceId = form.watch('serviceId');
  const selectedTime = form.watch('time');
  const selectedDate = form.watch('date');

  const selectedService = React.useMemo(() => 
    services?.find(s => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const endTime = React.useMemo(() => {
    if (!selectedService || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, selectedService.durationMinutes);
    return format(end, 'HH:mm');
  }, [selectedService, selectedTime]);

  async function onSubmit(data: BookingFormValues) {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const targetDate = format(data.date, 'yyyy-MM-dd');
      
      const clientRef = doc(collection(db, 'barberProfiles', user.uid, 'clients'));
      const clientId = clientRef.id;
      
      await setDoc(clientRef, {
        id: clientId,
        barberProfileId: user.uid,
        name: data.clientName,
        createdAt: serverTimestamp(),
      });

      const appointmentRef = doc(collection(db, 'barberProfiles', user.uid, 'appointments'));
      
      await setDoc(appointmentRef, {
        id: appointmentRef.id,
        barberProfileId: user.uid,
        clientId,
        staffId: data.staffId,
        serviceId: data.serviceId,
        date: targetDate,
        time: data.time,
        endTime: endTime,
        status: 'scheduled',
        priceAtAppointment: selectedService?.price || 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Agendamento Realizado!',
        description: `${data.clientName} marcado para ${format(data.date, 'dd/MM')} às ${data.time}.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar',
        description: 'Verifique sua conexão e tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isServicesLoading || isStaffLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando dados da barbearia...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} placeholder="Digite o nome para cadastro rápido" className="pl-10 bg-background" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background border-border hover:bg-accent",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Escolha a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200] pointer-events-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                          setTimeout(() => setIsCalendarOpen(false), 150);
                        }
                      }}
                      locale={ptBR}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0,0,0,0))
                      }
                      initialFocus
                      className="bg-card shadow-2xl border-primary/20"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...field} type="time" className="pl-10 bg-background" />
                  </div>
                </FormControl>
                {endTime && (
                  <FormDescription className="text-primary text-xs font-bold">
                    Término previsto: {endTime}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barbeiro</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Escolha o profissional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[150]">
                    {staff?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviço</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[150]">
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - R$ {s.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Agendamento'}
        </Button>
      </form>
    </Form>
  );
}