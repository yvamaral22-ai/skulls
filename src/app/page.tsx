"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Users, Calendar, Plus, Loader2, Menu } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import * as React from "react"
import { format } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarTrigger>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SidebarTrigger>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Skull Barber - Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Resumo real da sua barbearia hoje.</p>
          </div>
        </div>
        <Button className="w-full md:w-auto h-12 md:h-10 bg-primary hover:bg-primary/90 text-white font-bold" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase opacity-60">Agenda</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-3xl font-black">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase opacity-60">Receita</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-3xl font-black text-green-500">R$ {totalRevenueToday.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase opacity-60">Clientes</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-3xl font-black">{clients?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-4 md:p-6">
            <CardTitle className="text-[10px] md:text-sm font-medium uppercase opacity-60">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-3xl font-black">{services?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-secondary/20">
            <CardTitle className="font-headline text-lg">Próximos Clientes</CardTitle>
            <CardDescription>Agenda para hoje.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 5).map((appt) => {
                  const client = clients?.find(c => c.id === appt.clientId)
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-sm">
                        {appt.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{client?.name || 'Cliente'}</p>
                        <p className="text-xs text-muted-foreground truncate">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-accent text-sm">R$ {(Number(appt.priceAtAppointment) || Number(service?.price) || 0).toFixed(0)}</p>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${appt.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                          {appt.status === 'completed' ? 'OK' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center py-12 text-muted-foreground italic text-sm">Nenhum atendimento para hoje.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="w-full justify-start h-12 gap-3 border-border hover:bg-primary/10" asChild>
              <Link href="/services">
                <Scissors className="h-5 w-5 text-primary" /> Gerenciar Catálogo
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 gap-3 border-border hover:bg-primary/10" asChild>
              <Link href="/staff">
                <Users className="h-5 w-5 text-primary" /> Ver Equipe
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start h-12 gap-3 border-border hover:bg-primary/10" asChild>
              <Link href="/reports">
                <TrendingUp className="h-5 w-5 text-primary" /> Financeiro Detalhado
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
