"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Users, Calendar, Plus, Loader2, Briefcase } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import * as React from "react"
import { format } from "date-fns"

export default function DashboardPage() {
  const db = useFirestore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const barberShopId = "master-barbershop";

  const appointmentsQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'appointments'), [db]);
  const clientsQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'clients'), [db]);
  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'services'), [db]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
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

  if (isApptsLoading || isServicesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary">Painel de Controle</h1>
          <p className="text-muted-foreground text-sm">Resumo da sua operação hoje.</p>
        </div>
        <Button className="h-12 font-bold bg-primary shadow-xl" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-5 w-5" /> Novo Registro
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-bold uppercase opacity-60">Agenda Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-bold uppercase opacity-60">Bruto Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-500">R$ {totalRevenueToday.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-bold uppercase opacity-60">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{services?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-bold uppercase opacity-60">Staff Ativo</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">Online</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="font-headline text-lg">Próximos do Dia</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 10).map((appt) => {
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-black text-sm">
                        {appt.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{appt.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={appt.status === 'completed' ? 'default' : 'outline'}>
                          {appt.status === 'completed' ? 'PAGO' : 'AGUARDANDO'}
                        </Badge>
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

        <Card className="border-none bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Button variant="outline" className="h-14 justify-start gap-4 border-2" asChild>
              <Link href="/agenda">
                <Calendar className="h-6 w-6 text-primary" /> Ver Calendário Semanal
              </Link>
            </Button>
            <Button variant="outline" className="h-14 justify-start gap-4 border-2" asChild>
              <Link href="/reports">
                <TrendingUp className="h-6 w-6 text-green-500" /> Relatório Financeiro
              </Link>
            </Button>
            <Button variant="outline" className="h-14 justify-start gap-4 border-2" asChild>
              <Link href="/services">
                <Scissors className="h-6 w-6 text-accent" /> Editar Catálogo de Preços
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
