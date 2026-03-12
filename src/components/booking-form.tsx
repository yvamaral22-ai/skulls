'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Loader2, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import { 
  Form as UIForm, 
  FormField as UIFormField, 
  FormItem as UIFormItem, 
  FormLabel as UIFormLabel, 
  FormControl as UIFormControl, 
  FormMessage as UIFormMessage 
} from '@/components/ui/form';

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
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
  '20:00', '20:30', '21:00'
];

export function BookingForm({ onSuccess, initialData }: BookingFormProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      date: initialData?.date ? (typeof initialData.date === 'string' ? parseISO(initialData.date) : initialData.date) : new Date(),
    },
  });

  const selectedDate = form.watch('date');
  const selectedStaffId = form.watch('staffId');

  const appointmentsQuery = useMemoFirebase(() => {
    if (!selectedDate || !selectedStaffId) return null;
    return query(
      collection(db, 'barberProfiles', barberShopId, 'appointments'),
      where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
      where('staffId', '==', selectedStaffId)
    );
  }, [db, selectedDate, selectedStaffId]);

  const { data: existingAppointments } = useCollection(appointmentsQuery);
  
  const occupiedSlots = React.useMemo(() => {
    if (!existingAppointments) return [];
    return existingAppointments
      .filter(a => a.id !== initialData?.id && a.status !== 'canceled')
      .map(a => a.time);
  }, [existingAppointments, initialData]);

  const isPastTime = (slot: string) => {
    if (selectedDate && isSameDay(selectedDate, new Date())) {
      const [slotHours, slotMinutes] = slot.split(':').map(Number);
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      if (slotHours < currentHours) return true;
      if (slotHours === currentHours && slotMinutes <= currentMinutes) return true;
    }
    return false;
  };

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
        title: isUpdate ? 'Sincronizado!' : 'Agendado!',
        description: `${data.clientName} às ${data.time} no dia ${format(data.date, 'dd/MM/yyyy')}.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <UIForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <UIFormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <UIFormItem>
              <UIFormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Nome do Cliente</UIFormLabel>
              <UIFormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input {...field} placeholder="Ex: João Silva" className="pl-10 h-12 bg-background/50 border-border focus:border-primary transition-all font-body" />
                </div>
              </UIFormControl>
              <UIFormMessage className="text-[10px]" />
            </UIFormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <UIFormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <UIFormItem className="flex flex-col">
                <UIFormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Data</UIFormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <UIFormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full text-left font-normal h-12 bg-background/50 border-border hover:border-primary font-body flex items-center justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <span>{field.value ? format(field.value, "dd/MM/yyyy") : "Escolher data"}</span>
                        <CalendarIcon className="h-4 w-4 opacity-40" />
                      </Button>
                    </UIFormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => { 
                        if (date) field.onChange(date); 
                      }}
                      locale={ptBR}
                      disabled={(date) => startOfDay(date) < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <UIFormMessage className="text-[10px]" />
              </UIFormItem>
            )}
          />

          <UIFormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <UIFormItem>
                <UIFormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Horário</UIFormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <UIFormControl>
                    <SelectTrigger className="h-12 bg-background/50 border-border font-body">
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                  </UIFormControl>
                  <SelectContent className="max-h-[300px] font-body">
                    {TIME_SLOTS.map((slot) => {
                      const isOccupied = occupiedSlots.includes(slot);
                      const isPast = isPastTime(slot);
                      return (
                        <SelectItem key={slot} value={slot} disabled={isOccupied || isPast} className="text-xs">
                          {slot} {isOccupied ? '(Ocupado)' : isPast ? '(Indisponível)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <UIFormMessage className="text-[10px]" />
              </UIFormItem>
            )}
          />
        </div>

        <UIFormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <UIFormItem>
              <UIFormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Barbeiro</UIFormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isStaffLoading}>
                <UIFormControl>
                  <SelectTrigger className="h-12 bg-background/50 border-border font-body">
                    <SelectValue placeholder={isStaffLoading ? "Carregando..." : "Selecione o profissional"} />
                  </SelectTrigger>
                </UIFormControl>
                <SelectContent className="font-body">
                  {staff?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <UIFormMessage className="text-[10px]" />
            </UIFormItem>
          )}
        />

        <UIFormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <UIFormItem>
              <UIFormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Serviço</UIFormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isServicesLoading}>
                <UIFormControl>
                  <SelectTrigger className="h-12 bg-background/50 border-border font-body">
                    <SelectValue placeholder={isServicesLoading ? "Carregando..." : "Selecione o serviço"} />
                  </SelectTrigger>
                </UIFormControl>
                <SelectContent className="font-body">
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} - R$ {Number(s.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <UIFormMessage className="text-[10px]" />
            </UIFormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-sm font-bold shadow-xl bg-primary text-black hover:bg-primary/90 mt-4 uppercase font-body">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          {initialData?.id ? 'Salvar Alterações' : 'Confirmar Agendamento'}
        </Button>
      </form>
    </UIForm>
  );
}
