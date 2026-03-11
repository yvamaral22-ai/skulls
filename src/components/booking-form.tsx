'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, UserPlus, Loader2, Pencil } from 'lucide-react';
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
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
  initialData?: any; // Dados para edição
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

  const clientsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'clients');
  }, [db, barberProfileId]);

  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection(staffQuery);
  const { data: clients } = useCollection(clientsQuery);

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

  // Atualizar nome do cliente se estiver editando e os clientes carregarem
  React.useEffect(() => {
    if (initialData?.clientId && clients) {
      const client = clients.find(c => c.id === initialData.clientId);
      if (client) {
        form.setValue('clientName', client.name);
      }
    }
  }, [initialData, clients, form]);

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
      toast({ variant: 'destructive', title: 'Erro de autenticação', description: 'Você precisa estar logado.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const targetDate = format(data.date, 'yyyy-MM-dd');
      
      if (initialData?.id) {
        // EDIÇÃO de agendamento existente
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

        toast({
          title: 'Agendamento Atualizado!',
          description: `O horário foi remarcado com sucesso.`,
        });
      } else {
        // NOVO agendamento
        const barberRef = doc(db, 'barberProfiles', user.uid);
        await setDoc(barberRef, { id: user.uid, lastActivity: serverTimestamp() }, { merge: true });

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
          priceAtAppointment: Number(selectedService?.price) || 0,
          createdAt: serverTimestamp(),
        });

        toast({
          title: 'Agendamento Realizado!',
          description: `${data.clientName} marcado para ${format(data.date, 'dd/MM')} às ${data.time}.`,
        });
      }
      
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isServicesLoading || isStaffLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Atendimento</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background border-border h-11",
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
                    <Input {...field} type="time" className="pl-10 bg-background h-11" />
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

        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    {...field} 
                    placeholder="Digite o nome completo" 
                    className="pl-10 bg-background h-11" 
                    disabled={!!initialData?.id} // Bloquear nome do cliente na edição para manter integridade
                  />
                </div>
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
                <FormLabel>Profissional</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background h-11">
                      <SelectValue placeholder="Escolha o barbeiro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[150]">
                    {staff?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    {(!staff || staff.length === 0) && (
                      <SelectItem value="none" disabled>Nenhum barbeiro ativo</SelectItem>
                    )}
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
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background h-11">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[150]">
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - R$ {Number(s.price).toFixed(2)}
                      </SelectItem>
                    ))}
                    {(!services || services.length === 0) && (
                      <SelectItem value="none" disabled>Nenhum serviço cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl shadow-xl shadow-primary/20"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {initialData?.id ? <Pencil className="h-5 w-5" /> : null}
              <span>{initialData?.id ? 'Salvar Alterações' : 'Confirmar Agendamento'}</span>
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}
