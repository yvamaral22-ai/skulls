"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Calendar, Plus, Loader2, Briefcase } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import * as React from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const db = useFirestore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const barberShopId = "master-barbershop";

  const appointmentsQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberShopId, 'appointments'), [db]);
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
          <h1 className="text-4xl font-headline text-primary">Barbearia Skull's</h1>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Painel de Comando Central</p>
        </div>
        <Button className="h-12 font-bold bg-primary text-black shadow-xl shadow-primary/20" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-5 w-5" /> Novo Registro
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em]">Agenda Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline tracking-widest">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em]">Bruto Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-primary tracking-widest">R$ {totalRevenueToday.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em]">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline tracking-widest">{services?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60 tracking-[0.2em]">Status</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline text-green-500 tracking-widest">OPEN</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-primary/10 bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-xl font-headline text-primary">Próximos Alvos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 10).map((appt) => {
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-black font-headline text-lg tracking-normal">
                        {appt.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-sm uppercase tracking-wide">{appt.clientName}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-[0.1em]">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={appt.status === 'completed' ? 'default' : 'outline'} className={appt.status === 'completed' ? 'bg-primary text-black' : 'border-primary/30 text-primary'}>
                          {appt.status === 'completed' ? 'PAGO' : 'PENDENTE'}
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

        <Card className="border border-primary/10 bg-card shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-xl font-headline text-primary">Operações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-6">
            <Button variant="outline" className="h-16 justify-start gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all" asChild>
              <Link href="/agenda">
                <Calendar className="h-6 w-6 text-primary" /> 
                <div className="text-left">
                  <p className="font-headline text-base">Calendário Semanal</p>
                  <p className="text-[10px] uppercase opacity-50 tracking-[0.1em]">Logística de horários</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 justify-start gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all" asChild>
              <Link href="/reports">
                <TrendingUp className="h-6 w-6 text-primary" /> 
                <div className="text-left">
                  <p className="font-headline text-base">Relatório Tático</p>
                  <p className="text-[10px] uppercase opacity-50 tracking-[0.1em]">Inteligência financeira</p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-16 justify-start gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all" asChild>
              <Link href="/services">
                <Scissors className="h-6 w-6 text-primary" /> 
                <div className="text-left">
                  <p className="font-headline text-base">Menu de Combate</p>
                  <p className="text-[10px] uppercase opacity-50 tracking-[0.1em]">Gestão de serviços</p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
