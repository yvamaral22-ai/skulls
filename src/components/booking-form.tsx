'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMinutes, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, UserPlus, Loader2, Pencil, Check } from 'lucide-react';
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
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

interface BookingFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function BookingForm({ onSuccess, initialData }: BookingFormProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const barberProfileId = user?.uid;

  const servicesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'services');
  }, [db, barberProfileId]);

  const staffQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'staff');
  }, [db, barberProfileId]);

  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: initialData?.clientName || '',
      staffId: initialData?.staffId || '',
      serviceId: initialData?.serviceId || '',
      time: initialData?.time || '09:00',
      date: initialData?.date ? parseISO(initialData.date) : new Date(),
    },
  });

  const selectedServiceId = form.watch('serviceId');
  const selectedTime = form.watch('time');

  const selectedService = React.useMemo(() => 
    services?.find(s => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const endTime = React.useMemo(() => {
    if (!selectedService || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, Number(selectedService.durationMinutes) || 30);
    return format(end, 'HH:mm');
  }, [selectedService, selectedTime]);

  async function onSubmit(data: BookingFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const targetDate = format(data.date, 'yyyy-MM-dd');
      
      if (initialData?.id) {
        const appointmentRef = doc(db, 'barberProfiles', user.uid, 'appointments', initialData.id);
        updateDocumentNonBlocking(appointmentRef, {
          staffId: data.staffId,
          serviceId: data.serviceId,
          date: targetDate,
          time: data.time,
          endTime: endTime,
          priceAtAppointment: Number(selectedService?.price) || 0,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Sucesso', description: 'Agendamento atualizado.' });
      } else {
        const clientRef = doc(collection(db, 'barberProfiles', user.uid, 'clients'));
        const appointmentRef = doc(collection(db, 'barberProfiles', user.uid, 'appointments'));
        
        await setDoc(clientRef, {
          id: clientRef.id,
          barberProfileId: user.uid,
          name: data.clientName,
          createdAt: serverTimestamp(),
        });

        await setDoc(appointmentRef, {
          id: appointmentRef.id,
          barberProfileId: user.uid,
          clientId: clientRef.id,
          staffId: data.staffId,
          serviceId: data.serviceId,
          date: targetDate,
          time: data.time,
          endTime: endTime,
          status: 'scheduled',
          priceAtAppointment: Number(selectedService?.price) || 0,
          createdAt: serverTimestamp(),
        });

        toast({
          title: 'Agendamento Confirmado!',
          description: `${data.clientName} agendado para ${format(data.date, 'dd/MM')} às ${data.time}.`,
        });
      }
      
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro no Agendamento:", error);
      toast({
        variant: 'destructive',
        title: 'Falha no Agendamento',
        description: 'Ocorreu um erro ao gravar no banco.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isServicesLoading || isStaffLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Carregando formulário...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
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
                          "w-full text-left font-normal h-12 md:h-11",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Escolha a data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsCalendarOpen(false);
                      }}
                      locale={ptBR}
                      disabled={(date) => startOfDay(date) < startOfDay(new Date())}
                      initialFocus
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
                  <Input {...field} type="time" className="h-12 md:h-11 bg-background" />
                </FormControl>
                {endTime && <p className="text-[10px] text-primary font-bold">Término: {endTime}</p>}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do cliente" className="h-12 md:h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barbeiro</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 md:h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {staff?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                    <SelectTrigger className="h-12 md:h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} - R$ {Number(s.price).toFixed(2)}</SelectItem>
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
          disabled={isSubmitting}
          className="w-full h-14 md:h-12 text-lg font-bold shadow-lg bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
          {initialData?.id ? 'Salvar Alterações' : 'Confirmar Agendamento'}
        </Button>
      </form>
    </Form>
  );
}
