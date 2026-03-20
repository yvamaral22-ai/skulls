
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Calendar, Plus, Loader2, Briefcase, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, query, where } from "firebase/firestore"
import * as React from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookingForm } from "@/components/booking-form"
import { CheckoutDialog } from "@/components/checkout-dialog"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const db = useFirestore()
  const { role, staffId, barberProfileId, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [editingAppointment, setEditingAppointment] = React.useState<any | null>(null);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    const baseCol = collection(db, 'barbers', barberProfileId, 'appointments');
    // Se for STAFF, vê apenas os seus
    if (role === 'STAFF' && staffId) {
      return query(baseCol, where('staffId', '==', staffId));
    }
    // Se for ADMIN, vê todos
    return baseCol;
  }, [db, barberProfileId, role, staffId]);

  const servicesQuery = useMemoFirebase(() => {
    if (!barberProfileId) return null;
    return collection(db, 'barbers', barberProfileId, 'services');
  }, [db, barberProfileId]);

  const { data: appointments, isLoading: isApptsLoading } = useCollection(appointmentsQuery);
  const { data: services, isLoading: isServicesLoading } = useCollection(servicesQuery);

  const todayAppointments = React.useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter(a => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, today]);

  const totalRevenueToday = React.useMemo(() => {
    return todayAppointments
      .filter(a => a.status === 'completed')
      .reduce((acc, appt) => acc + Number(appt.priceAtAppointment || 0), 0);
  }, [todayAppointments]);

  const handleDelete = async (id: string) => {
    if (!barberProfileId) return;
    try {
      await deleteDoc(doc(db, 'barbers', barberProfileId, 'appointments', id));
      setEditingAppointment(null);
      toast({ variant: "destructive", title: "Excluído", description: "O horário foi removido." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Se não estiver identificado como Admin ou Staff, mostra tela de entrada amigável
  if (role !== 'ADMIN' && role !== 'STAFF') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 max-w-md mx-auto animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative p-8 bg-card border border-primary/20 rounded-full shadow-2xl">
            <Scissors className="h-16 w-16 text-primary animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-headline text-primary uppercase tracking-tighter leading-tight">
            BEM-VINDO À <br /> BARBEARIA SKULL'S
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed px-4">
            Sua conta está ativa. Para gerenciar agendamentos e ver seu painel personalizado, acesse o menu oficial.
          </p>
        </div>

        <Button asChild className="h-16 w-full max-w-xs bg-primary text-black font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform rounded-2xl" variant="default">
          <Link href="/agenda">ACESSAR MENU</Link>
        </Button>
        
        <div className="pt-8 opacity-40">
          <p className="text-[10px] uppercase font-bold tracking-[0.3em]">Gestão de Elite • Versão 2024</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-headline text-primary uppercase tracking-tighter">Barbearia Skull's</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
            <span className="h-1 w-8 bg-primary/30" />
            {role === 'ADMIN' ? 'Painel do Barbeiro (Acesso Total)' : 'Painel do Funcionário'}
          </p>
        </div>
        <Button className="h-14 w-full sm:w-auto font-black bg-primary text-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform rounded-xl" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-5 w-5" /> NOVO AGENDAMENTO
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none bg-card shadow-2xl border-l-4 border-l-primary group hover:bg-primary/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-50">Atendimentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-headline">{todayAppointments.length}</div>
            <p className="text-[9px] text-muted-foreground uppercase mt-1">Horários agendados</p>
          </CardContent>
        </Card>

        {role === 'ADMIN' && (
          <Card className="border-none bg-card shadow-2xl border-l-4 border-l-primary group hover:bg-primary/5 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-50">Faturamento Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-headline text-primary">R$ {totalRevenueToday.toFixed(0)}</div>
              <p className="text-[9px] text-muted-foreground uppercase mt-1">Ganhos brutos acumulados</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-none bg-card shadow-2xl border-l-4 border-l-primary group hover:bg-primary/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-50">Cortes Concluídos</CardTitle>
            <Scissors className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-headline">
              {appointments?.filter(a => a.status === 'completed').length || 0}
            </div>
            <p className="text-[9px] text-muted-foreground uppercase mt-1">Total acumulado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border bg-card shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-primary/5 border-b border-border/50 px-6 py-6">
            <CardTitle className="text-xl font-headline text-primary uppercase">Próximos Horários</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[450px] overflow-y-auto scrollbar-thin">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => {
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div 
                      key={appt.id} 
                      onClick={() => setEditingAppointment(appt)}
                      className="flex items-center gap-4 p-5 hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-black font-headline text-lg shrink-0 shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                        {appt.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{appt.clientName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={appt.status === 'completed' ? 'default' : 'outline'} className={cn(
                          "text-[9px] font-bold px-3 py-1 uppercase",
                          appt.status === 'completed' ? 'bg-green-600 text-white border-none' : 'border-primary/30 text-primary'
                        )}>
                          {appt.status === 'completed' ? 'PAGO' : 'AGENDADO'}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                  <Calendar className="h-12 w-12 opacity-10" />
                  <p className="italic text-sm uppercase tracking-widest opacity-50">Nenhum atendimento para hoje.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50 px-6 py-6">
            <CardTitle className="text-xl font-headline text-primary uppercase">Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 p-6">
            <Button variant="outline" className="h-20 justify-start gap-6 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group rounded-2xl" asChild>
              <Link href="/agenda">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-black transition-colors">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-headline text-lg uppercase tracking-tight">Ver Agenda</p>
                  <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Confira os horários</p>
                </div>
              </Link>
            </Button>
            {role === 'ADMIN' && (
              <>
                <Button variant="outline" className="h-20 justify-start gap-6 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group rounded-2xl" asChild>
                  <Link href="/reports">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-black transition-colors">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline text-lg uppercase tracking-tight">Financeiro</p>
                      <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Relatórios e ganhos</p>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 justify-start gap-6 border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group rounded-2xl" asChild>
                  <Link href="/staff">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-black transition-colors">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline text-lg uppercase tracking-tight">Gestão de Equipe</p>
                      <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">Controle de barbeiros</p>
                    </div>
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="w-[95vw] max-w-[450px] border-none shadow-3xl bg-card">
          <DialogHeader className="p-4 border-b border-border/50">
            <DialogTitle className="font-headline text-2xl text-primary uppercase">Atendimento</DialogTitle>
          </DialogHeader>
          {editingAppointment && (
            <div className="p-4 space-y-6">
              <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                <BookingForm initialData={editingAppointment} onSuccess={() => setEditingAppointment(null)} />
              </div>
              <div className="flex gap-3 pt-6 border-t border-border/50">
                {editingAppointment.status !== 'completed' && (
                  <CheckoutDialog 
                    appointmentId={editingAppointment.id} 
                    customerName={editingAppointment.clientName} 
                    serviceName={services?.find(s => s.id === editingAppointment.serviceId)?.name || 'Serviço'}
                    price={editingAppointment.priceAtAppointment || 0}
                    staffId={editingAppointment.staffId}
                    onSuccess={() => setEditingAppointment(null)}
                  />
                )}
                <Button variant="ghost" onClick={() => handleDelete(editingAppointment.id)} className="flex-1 text-destructive font-bold uppercase text-[10px] hover:bg-destructive/10">Excluir</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
