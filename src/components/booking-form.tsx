'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const bookingSchema = z.object({
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

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export function BookingForm({ onSuccess, initialData }: BookingFormProps) {
  const { user, role } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [targetBarberShopId, setTargetBarberShopId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchShop() {
      if (role === 'BARBER' || role === 'ADMIN') {
        setTargetBarberShopId(user?.uid || null);
      } else {
        const q = query(collection(db, 'barberProfiles'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) setTargetBarberShopId(snap.docs[0].id);
      }
    }
    fetchShop();
  }, [user, role, db]);

  const servicesQuery = useMemoFirebase(() => {
    if (!targetBarberShopId) return null;
    return collection(db, 'barberProfiles', targetBarberShopId, 'services');
  }, [db, targetBarberShopId]);

  const staffQuery = useMemoFirebase(() => {
    if (!targetBarberShopId) return null;
    return collection(db, 'barberProfiles', targetBarberShopId, 'staff');
  }, [db, targetBarberShopId]);

  const { data: services } = useCollection(servicesQuery);
  const { data: staff } = useCollection(staffQuery);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      staffId: initialData?.staffId || '',
      serviceId: initialData?.serviceId || '',
      time: initialData?.time || '',
      date: initialData?.date ? parseISO(initialData.date) : new Date(),
    },
  });

  const selectedDate = form.watch('date');
  const selectedStaffId = form.watch('staffId');

  const appointmentsQuery = useMemoFirebase(() => {
    if (!targetBarberShopId || !selectedDate || !selectedStaffId) return null;
    return query(
      collection(db, 'barberProfiles', targetBarberShopId, 'appointments'),
      where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
      where('staffId', '==', selectedStaffId),
      where('status', '!=', 'Canceled')
    );
  }, [db, targetBarberShopId, selectedDate, selectedStaffId]);

  const { data: existingAppointments } = useCollection(appointmentsQuery);

  const occupiedSlots = React.useMemo(() => {
    return existingAppointments?.map(a => a.time) || [];
  }, [existingAppointments]);

  async function onSubmit(data: BookingFormValues) {
    if (!user || !targetBarberShopId) return;
    
    setIsSubmitting(true);
    const targetDateStr = format(data.date, 'yyyy-MM-dd');

    try {
      const selectedService = services?.find(s => s.id === data.serviceId);
      const apptId = initialData?.id || doc(collection(db, 'barberProfiles', targetBarberShopId, 'appointments')).id;
      
      const appointmentData = {
        id: apptId,
        barberProfileId: targetBarberShopId,
        clientId: user.uid,
        clientName: user.displayName || 'Cliente',
        staffId: data.staffId,
        serviceId: data.serviceId,
        date: targetDateStr,
        time: data.time,
        status: 'scheduled',
        priceAtAppointment: Number(selectedService?.price) || 0,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'barberProfiles', targetBarberShopId, 'appointments', apptId), appointmentData);

      toast({
        title: 'Sucesso!',
        description: `Horário reservado para ${format(data.date, 'dd/MM')} às ${data.time}.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o agendamento.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escolha o Profissional</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background">
                      <SelectValue placeholder="Selecione o barbeiro" />
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
                <FormLabel>O que vamos fazer?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex justify-between w-full gap-8">
                          <span>{s.name}</span>
                          <span className="font-bold text-primary">R$ {Number(s.price).toFixed(2)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Quando?</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full text-left font-normal h-12 bg-background",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Escolha a data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[1001]" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                          form.setValue('time', ''); 
                        }
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

          {selectedDate && selectedStaffId ? (
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horários Disponíveis</FormLabel>
                  <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg bg-secondary/10">
                    {TIME_SLOTS.map((slot) => {
                      const isOccupied = occupiedSlots.includes(slot);
                      const isSelected = field.value === slot;
                      return (
                        <Button
                          key={slot}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          disabled={isOccupied}
                          className={cn(
                            "text-xs font-bold h-10 px-0",
                            isOccupied && "opacity-20 cursor-not-allowed bg-secondary",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => field.onChange(slot)}
                        >
                          {slot}
                        </Button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="p-4 rounded-lg bg-secondary/20 border border-dashed text-center text-xs text-muted-foreground">
              Selecione um barbeiro e uma data para ver os horários.
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || !form.watch('time')}
          className="w-full h-14 text-lg font-bold shadow-xl bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
          Confirmar Agendamento
        </Button>
      </form>
    </Form>
  );
}
