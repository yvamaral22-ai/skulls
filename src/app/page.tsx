"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, TrendingUp, Calendar, Plus, Loader2, Briefcase, Clock, User, Scissors as ScissorsIcon } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, doc, deleteDoc, query, where } from "firebase/firestore"
import * as React from "react"
import { format, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
    const baseCol = collection(db, 'barberProfiles', barberProfileId, 'appointments');
    if (role === 'STAFF' && staffId) {
      return query(baseCol, where('staffId', '==', staffId));
    }
    return baseCol;
  }, [db, barberProfileId, role, staffId]);

  const servicesQuery = useMemoFirebase(() => collection(db, 'barberProfiles', barberProfileId, 'services'), [db, barberProfileId]);

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
      .reduce((acc, appt) => {
        const val = role === 'STAFF' ? (appt.commissionAtAppointment || 0) : (appt.priceAtAppointment || 0);
        return acc + Number(val);
      }, 0);
  }, [todayAppointments, role]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'barberProfiles', barberProfileId, 'appointments', id));
      setEditingAppointment(null);
      toast({ variant: "destructive", title: "Excluído", description: "O horário foi removido." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  if (isAuthLoading || isApptsLoading || isServicesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline text-primary">Skulls Barber</h1>
          <p className="text-muted-foreground text-[9px] uppercase tracking-[0.2em]">
            {role === 'ADMIN' ? 'Painel Administrativo' : 'Painel do Barbeiro'}
          </p>
        </div>
        <Button className="h-12 w-full sm:w-auto font-bold bg-primary text-black" asChild>
          <Link href="/agenda">
            <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
            <CardTitle className="text-[9px] font-bold uppercase opacity-60">Agenda Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-2xl md:text-3xl font-bold font-headline">{todayAppointments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
            <CardTitle className="text-[9px] font-bold uppercase opacity-60">
              {role === 'STAFF' ? 'Sua Comissão' : 'Bruto Hoje'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-2xl md:text-3xl font-bold font-headline text-primary">R$ {totalRevenueToday.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
            <CardTitle className="text-[9px] font-bold uppercase opacity-60">Total Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-2xl md:text-3xl font-bold font-headline">{appointments?.filter(a => a.status === 'completed').length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-card shadow-lg border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
            <CardTitle className="text-[9px] font-bold uppercase opacity-60">Status</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="text-2xl md:text-3xl font-bold font-headline text-green-500">ABERTO</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-primary/10 bg-card shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 px-4 py-4">
            <CardTitle className="text-lg font-headline text-primary">Próximos Clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto scrollbar-thin">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => {
                  const service = services?.find(s => s.id === appt.serviceId)
                  return (
                    <div 
                      key={appt.id} 
                      onClick={() => setEditingAppointment(appt)}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-black font-headline text-base shrink-0">
                        {appt.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-xs uppercase group-hover:text-primary">{appt.clientName}</p>
                        <p className="text-[9px] text-muted-foreground truncate uppercase">{service?.name || 'Serviço'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={appt.status === 'completed' ? 'default' : 'outline'} className={cn(
                          "text-[8px]",
                          appt.status === 'completed' ? 'bg-primary text-black' : 'border-primary/30 text-primary'
                        )}>
                          {appt.status === 'completed' ? 'PAGO' : 'PENDENTE'}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center py-12 text-muted-foreground italic text-sm">Nenhum agendamento para hoje.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-primary/10 bg-card shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-primary/10 px-4 py-4">
            <CardTitle className="text-lg font-headline text-primary">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:gap-4 pt-6 px-4 pb-6">
            <Button variant="outline" className="h-16 justify-start gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left" asChild>
              <Link href="/agenda">
                <Calendar className="h-6 w-6 text-primary shrink-0" /> 
                <div className="min-w-0">
                  <p className="font-headline text-base truncate">Agenda</p>
                  <p className="text-[9px] uppercase opacity-50 truncate">Gestão de horários</p>
                </div>
              </Link>
            </Button>
            {role === 'ADMIN' && (
              <>
                <Button variant="outline" className="h-16 justify-start gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left" asChild>
                  <Link href="/reports">
                    <TrendingUp className="h-6 w-6 text-primary shrink-0" /> 
                    <div className="min-w-0">
                      <p className="font-headline text-base truncate">Relatórios</p>
                      <p className="text-[9px] uppercase opacity-50 truncate">Financeiro consolidado</p>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" className="h-16 justify-start gap-4 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left" asChild>
                  <Link href="/staff">
                    <Briefcase className="h-6 w-6 text-primary shrink-0" /> 
                    <div className="min-w-0">
                      <p className="font-headline text-base truncate">Equipe</p>
                      <p className="text-[9px] uppercase opacity-50 truncate">Gestão de barbeiros</p>
                    </div>
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="w-[95vw] max-w-[450px]">
          <DialogHeader><DialogTitle className="font-headline text-xl text-primary">Atendimento</DialogTitle></DialogHeader>
          {editingAppointment && (
            <div className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto"><BookingForm initialData={editingAppointment} onSuccess={() => setEditingAppointment(null)} /></div>
              <div className="flex gap-2 pt-4 border-t">
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
                <Button variant="ghost" onClick={() => handleDelete(editingAppointment.id)} className="flex-1 text-destructive font-bold uppercase text-[9px]">Excluir</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
