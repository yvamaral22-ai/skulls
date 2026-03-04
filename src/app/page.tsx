"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Users, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { APPOINTMENTS, SERVICES, CUSTOMERS } from "./lib/mock-data"

export default function DashboardPage() {
  const today = "2025-05-20"
  const todayAppointments = APPOINTMENTS.filter(a => a.date === today)
  const totalRevenueToday = todayAppointments.reduce((acc, appt) => {
    const service = SERVICES.find(s => s.id === appt.serviceId)
    return acc + (service?.price || 0)
  }, 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bem-vindo, Barbeiro!</h1>
          <p className="text-muted-foreground">Aqui está o resumo da sua barbearia hoje.</p>
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
            <p className="text-xs text-muted-foreground">+2 em relação a ontem</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenueToday.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+15% desde a última semana</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CUSTOMERS.length}</div>
            <p className="text-xs text-muted-foreground">Novos clientes este mês: 12</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg hover:shadow-primary/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Oferecidos</CardTitle>
            <Scissors className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SERVICES.length}</div>
            <p className="text-xs text-muted-foreground">3 tipos de químicas disponíveis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Próximos Clientes</CardTitle>
            <CardDescription>Sua agenda para o dia {today}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appt) => {
                const customer = CUSTOMERS.find(c => c.id === appt.customerId)
                const service = SERVICES.find(s => s.id === appt.serviceId)
                return (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      {appt.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{customer?.name}</p>
                      <p className="text-sm text-muted-foreground">{service?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent">R$ {service?.price.toFixed(2)}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${appt.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                        {appt.status === 'completed' ? 'Concluído' : 'Agendado'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Serviços em Alta</CardTitle>
            <CardDescription>Os mais pedidos da semana.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SERVICES.slice(0, 3).map((service, idx) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{[45, 28, 12][idx]} cortes</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
