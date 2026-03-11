
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  Plus, 
  Mail, 
  Phone, 
  TrendingUp, 
  Scissors, 
  CalendarDays, 
  Users, 
  BarChart2,
  Clock
} from "lucide-react"
import { STAFF, APPOINTMENTS, SERVICES } from "../lib/mock-data"

export default function StaffPage() {
  const todayDate = "2025-05-20" // Data âncora do protótipo

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestão da Equipe</h1>
          <p className="text-muted-foreground">Analise o desempenho e a agenda individual dos seus barbeiros.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Barbeiro
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {STAFF.map((member) => {
          // 1. Calcular Média de Atendimentos por Dia (Baseado em Checkouts/Status 'completed')
          const staffAppts = APPOINTMENTS.filter(a => a.staffId === member.id)
          const completedAppts = staffAppts.filter(a => a.status === 'completed')
          const uniqueDays = new Set(completedAppts.map(a => a.date)).size
          const avgPerDay = uniqueDays > 0 ? (completedAppts.length / uniqueDays).toFixed(1) : 0

          // 2. Agendamentos para hoje
          const todayAppts = staffAppts.filter(a => a.date === todayDate)
          const scheduledTodayCount = todayAppts.length

          return (
            <Card key={member.id} className="border-none bg-card shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Briefcase className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle className="font-headline text-2xl">{member.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="bg-primary/10 text-primary uppercase text-[10px]">
                          Senior
                        </Badge>
                        <Badge variant="outline" className="border-green-500/30 text-green-500 text-[10px] uppercase">
                          Disponível
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Comissão</p>
                    <p className="text-xl font-black text-primary">{(member.commissionRate * 100)}%</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Métricas Analíticas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 text-center">
                    <BarChart2 className="h-4 w-4 text-accent mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Média Diária</p>
                    <p className="text-xl font-bold">{avgPerDay}</p>
                  </div>
                  <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 text-center">
                    <Users className="h-4 w-4 text-primary mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Agenda Hoje</p>
                    <p className="text-xl font-bold">{scheduledTodayCount}</p>
                  </div>
                  <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 text-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mx-auto mb-2" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Mês</p>
                    <p className="text-xl font-bold">{staffAppts.length}</p>
                  </div>
                </div>

                {/* Agenda do Dia */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <CalendarDays className="h-4 w-4" /> Serviços de Hoje ({todayDate})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-auto pr-2 custom-scrollbar">
                    {todayAppts.length > 0 ? (
                      todayAppts.sort((a,b) => a.time.localeCompare(b.time)).map((appt) => {
                        const service = SERVICES.find(s => s.id === appt.serviceId)
                        return (
                          <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-border/30">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {appt.time}
                              </div>
                              <span className="text-sm font-medium">{service?.name}</span>
                            </div>
                            <Badge variant={appt.status === 'completed' ? 'secondary' : 'default'} className="text-[10px]">
                              {appt.status === 'completed' ? 'Finalizado' : 'Aguardando'}
                            </Badge>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-4 bg-secondary/10 rounded-xl">
                        Nenhum compromisso para este barbeiro hoje.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1 bg-secondary hover:bg-secondary/80 text-xs">
                      <Mail className="mr-2 h-3 w-3" /> Contato
                    </Button>
                    <Button variant="outline" className="flex-1 border-primary/20 text-xs hover:bg-primary/10">
                      Editar Perfil
                    </Button>
                  </div>
                  <Button className="w-full h-11 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-bold">
                    Relatório Individual Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
