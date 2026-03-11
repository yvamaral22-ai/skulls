
'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, User, Scissors, Sparkles, CalendarDays, CheckCircle2, Wallet } from 'lucide-react';
import { APPOINTMENTS, CUSTOMERS, SERVICES, TRENDING_SERVICES, TRENDING_PRODUCTS, PRODUCTS } from '../lib/mock-data';
import { AiUpsellDialog } from '@/components/ai-upsell-dialog';
import { BookingForm } from '@/components/booking-form';
import { CheckoutDialog } from '@/components/checkout-dialog';

export default function AgendaPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  React.useEffect(() => {
    // Initialize date after mount to avoid hydration mismatch
    setDate(new Date('2025-05-20T00:00:00'));
  }, []);

  const filteredAppointments = React.useMemo(() => {
    if (!date) return [];
    const targetDateStr = date.toISOString().split('T')[0];
    return APPOINTMENTS.filter(appt => appt.date === targetDateStr);
  }, [date]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Skull Barber - Agenda</h1>
            <p className="text-muted-foreground">Gerencie o fluxo de atendimentos da equipe.</p>
          </div>
          
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  Agendar Cliente
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para reservar o horário.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <BookingForm onSuccess={() => setIsBookingOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-lg">Filtro por Data</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center calendar-custom">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Dica do Líder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
              <Wallet className="h-6 w-6 text-accent shrink-0" />
              <p className="text-sm leading-relaxed text-accent-foreground">
                Não esqueça de realizar o <strong>Checkout</strong> após cada serviço para que as comissões e o lucro do dia sejam computados corretamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">
                Agenda de {date ? date.toLocaleDateString('pt-BR') : '...'}
              </CardTitle>
              <CardDescription>{filteredAppointments.length} horários ocupados.</CardDescription>
            </div>
            <Tabs defaultValue="list">
              <TabsList className="bg-secondary">
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((appt) => {
                  const customer = CUSTOMERS.find(c => c.id === appt.customerId);
                  const service = SERVICES.find(s => s.id === appt.serviceId);
                  const isCompleted = appt.status === 'completed';

                  return (
                    <div key={appt.id} className="group relative">
                      <div className={cn(
                        "flex items-center gap-6 p-5 rounded-2xl border transition-all duration-300",
                        isCompleted 
                          ? "bg-secondary/10 border-green-500/20 opacity-80" 
                          : "bg-secondary/20 border-border/50 hover:bg-secondary/40 hover:border-primary/30"
                      )}>
                        <div className="flex flex-col items-center justify-center min-w-[70px] py-2 border-r border-border">
                          <Clock className="h-4 w-4 text-primary mb-1" />
                          <span className="font-bold text-lg">{appt.time}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-accent" />
                            <h3 className="font-bold text-lg">{customer?.name}</h3>
                            {isCompleted && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                                PAGO: {appt.paymentMethod}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{service?.name}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xl font-bold text-primary">R$ {service?.price.toFixed(2)}</span>
                          <div className="flex gap-2">
                            <AiUpsellDialog 
                              clientHistory={customer?.history || []}
                              clientPreferences={customer?.preferences || ''}
                              currentServices={[service?.name || '']}
                              availableServices={SERVICES.map(s => s.name)}
                              availableProducts={PRODUCTS}
                              trendingServices={TRENDING_SERVICES}
                              trendingProducts={TRENDING_PRODUCTS}
                            />
                            {!isCompleted && (
                              <CheckoutDialog 
                                appointmentId={appt.id}
                                customerName={customer?.name || ''}
                                serviceName={service?.name || ''}
                                price={service?.price || 0}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <Clock className="h-12 w-12 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground italic">Nenhum agendamento para este dia.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
