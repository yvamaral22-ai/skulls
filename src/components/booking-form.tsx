'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMinutes } from 'date-fns';
import { CalendarIcon, Clock, Scissors, User, UserPlus } from 'lucide-react';
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
import { SERVICES, STAFF, CUSTOMERS } from '@/app/lib/mock-data';
import { toast } from '@/hooks/use-toast';

const bookingSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente'),
  staffId: z.string().min(1, 'Selecione um barbeiro'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  date: z.date({
    required_error: 'Selecione uma data',
  }),
  time: z.string().min(1, 'Selecione um horário'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      time: '09:00',
    },
  });

  const selectedServiceId = form.watch('serviceId');
  const selectedTime = form.watch('time');

  const selectedService = React.useMemo(() => 
    SERVICES.find(s => s.id === selectedServiceId),
    [selectedServiceId]
  );

  const endTime = React.useMemo(() => {
    if (!selectedService || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = addMinutes(start, selectedService.duration);
    return format(end, 'HH:mm');
  }, [selectedService, selectedTime]);

  function onSubmit(data: BookingFormValues) {
    // Aqui integrariamos com o Firestore futuramente
    console.log('Agendamento criado:', {
      ...data,
      endTime,
      price: selectedService?.price,
    });
    
    toast({
      title: 'Agendamento solicitado!',
      description: `Horário reservado para ${data.time} até ${endTime}.`,
    });
    
    if (onSuccess) onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CUSTOMERS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Escolha o profissional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAFF.map(s => (
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
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="O que vamos fazer hoje?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SERVICES.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - R$ {s.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedService && (
                  <FormDescription className="text-accent text-xs">
                    Duração estimada: {selectedService.duration} min
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
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal border-border bg-background",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: undefined }) // Omitir locale por simplicidade no protótipo
                        ) : (
                          <span>Escolha a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="bg-card border-border"
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
                <FormLabel>Horário de Início</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...field} type="time" className="pl-10 bg-background border-border" />
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

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl">
          Confirmar Agendamento
        </Button>
      </form>
    </Form>
  );
}
