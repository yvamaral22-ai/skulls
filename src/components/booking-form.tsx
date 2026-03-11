
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Loader2, Check, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const bookingSchema = z.object({
  clientName: z.string().min(2, 'Informe o nome do cliente'),
  staffId: z.string().min(1, 'Selecione um barbeiro'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().min(1, 'Selecione um horário'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export function BookingForm({ onSuccess, initialData }: BookingFormProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const barberShopId = "master-barbershop";

  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'services'), [db]);
  const staffQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'staff'), [db]);

  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: initialData?.clientName || '',
      staffId: initialData?.staffId || '',
      serviceId: initialData?.serviceId || '',
      time: initialData?.time || '',
      date: initialData?.date ? parseISO(initialData.date) : new Date(),
    },
  });

  const selectedDate = form.watch('date');
  const selectedStaffId = form.watch('staffId');

  const appointmentsQuery = useMemoFirebase(() => {
    if (!selectedDate || !selectedStaffId) return null;
    return query(
      collection(db, 'barberProfiles', barberShopId, 'appointments'),
      where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
      where('staffId', '==', selectedStaffId),
      where('status', '!=', 'canceled')
    );
  }, [db, selectedDate, selectedStaffId]);

  const { data: existingAppointments } = useCollection(appointmentsQuery);
  const occupiedSlots = React.useMemo(() => {
    return existingAppointments
      ?.filter(a => a.id !== initialData?.id)
      ?.map(a => a.time) || [];
  }, [existingAppointments, initialData]);

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    const targetDateStr = format(data.date, 'yyyy-MM-dd');

    try {
      const selectedService = services?.find(s => s.id === data.serviceId);
      const isUpdate = !!initialData?.id;
      const apptId = initialData?.id || doc(collection(db, 'barberProfiles', barberShopId, 'appointments')).id;
      
      const appointmentData = {
        id: apptId,
        barberProfileId: barberShopId,
        clientName: data.clientName,
        staffId: data.staffId,
        serviceId: data.serviceId,
        date: targetDateStr,
        time: data.time,
        status: initialData?.status || 'scheduled',
        priceAtAppointment: Number(selectedService?.price) || 0,
        updatedAt: serverTimestamp(),
      };

      if (isUpdate) {
        await updateDoc(doc(db, 'barberProfiles', barberShopId, 'appointments', apptId), appointmentData);
      } else {
        await setDoc(doc(db, 'barberProfiles', barberShopId, 'appointments', apptId), {
          ...appointmentData,
          createdAt: serverTimestamp(),
        });
      }

      toast({
        title: isUpdate ? 'Agendamento Atualizado!' : 'Agendamento Salvo!',
        description: `${data.clientName} registrado com sucesso.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao salvar agendamento.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} placeholder="Digite o nome do cliente" className="pl-10 h-12 bg-background border-2" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                        type="button"
                        variant={"outline"}
                        className={cn("w-full text-left font-normal h-12 bg-background border-2", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10001]">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => { if (date) { field.onChange(date); setIsCalendarOpen(false); } }}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background border-2">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px] z-[10001]">
                    {TIME_SLOTS.map((slot) => {
                      const isOccupied = occupiedSlots.includes(slot);
                      return (
                        <SelectItem key={slot} value={slot} disabled={isOccupied}>
                          {slot} {isOccupied ? '(Ocupado)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barbeiro</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isStaffLoading}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-background border-2">
                    <SelectValue placeholder={isStaffLoading ? "Carregando..." : "Selecione o profissional"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="z-[10001]">
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
              <Select onValueChange={field.onChange} value={field.value} disabled={isServicesLoading}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-background border-2">
                    <SelectValue placeholder={isServicesLoading ? "Carregando..." : "Selecione o serviço"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="z-[10001]">
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - R$ {Number(s.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || isServicesLoading || isStaffLoading} className="w-full h-14 text-lg font-bold shadow-xl bg-primary hover:bg-primary/90 mt-4">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
          {initialData?.id ? 'Salvar Alterações' : 'Registrar Agendamento'}
        </Button>
      </form>
    </Form>
  );
}
