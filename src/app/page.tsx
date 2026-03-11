"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Users, Calendar, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import * as React from "react"
import { format } from "date-fns"

export default function DashboardPage() {
  const { user, isUserLoading: isAuthLoading } = useUser()
  const db = useFirestore()
  const today = format(new Date(), 'yyyy-MM-dd')

  const barberProfileId = user?.uid

  const appointmentsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'appointments');
  }, [db, barberProfileId]);

  const clientsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'clients');
  }, [db, barberProfileId]);

  const servicesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barberProfiles', barberProfileId, 'services');
  }, [db, barberProfileId]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
  const { data: clients, isLoading: isClientsLoading } = useCollection(clientsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);

  const todayAppointments = React.useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(a => a.date === today);
  }, [appointments, today]);

  const totalRevenueToday = React.useMemo(() => {
    return todayAppointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appt) => acc + (Number(appt.priceAtAppointment) || 0), 0);
  }, [todayAppointments]);

  if (isAuthLoading || isApptsLoading || isClientsLoading || isServicesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bem-vindo, Barbeiro!</h1>
          <p className="text-muted-foreground">Aqui está o resumo real da sua barbearia hoje.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Sincronizado com Firestore</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje (Paga)</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenueToday.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Baseado em checkouts reais</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Scissors className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
            <p className="text-xs text-muted-foreground">No seu catálogo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Próximos Clientes</CardTitle>
            <CardDescription>Agenda para hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 5).map((appt) => {
                  const client = clients?.find(c => c.id === appt.clientId)
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                        {appt.time}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{client?.name || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-accent">R$ {(Number(appt.priceAtAppointment) || Number(service?.price) || 0).toFixed(2)}</p>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${appt.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                          {appt.status === 'completed' ? 'Concluído' : 'Agendado'}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center py-8 text-muted-foreground italic">Nenhum atendimento para hoje.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Ações Rápidas</CardTitle>
            <CardDescription>Atalhos do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/services">
                <Scissors className="h-4 w-4" /> Gerenciar Catálogo
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/staff">
                <Users className="h-4 w-4" /> Ver Equipe
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/reports">
                <TrendingUp className="h-4 w-4" /> Ver Financeiro
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}